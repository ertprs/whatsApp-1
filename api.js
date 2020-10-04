const express = require("express");
const bodyParser = require("body-parser");
const fs = require('fs');
const axios = require('axios');
const shelljs = require('shelljs');//no se lo usa
const cors = require('cors');
const config = require('./config.json');
const { Client } = require('whatsapp-web.js');
const SESSION_FILE_PATH = './session.json';
let sessionCfg;
if (fs.existsSync(SESSION_FILE_PATH)) {
    sessionCfg = require(SESSION_FILE_PATH);
}
process.title = "whatsapp-node-api";
global.client = new Client({ puppeteer: { headless: true , args:['--no-sandbox','--disable-setuid-sandbox','--unhandled-rejections=strict'] }, session: sessionCfg, executablePath: 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'});
global.authed = false;
const app = express();
const port = process.env.PORT || config.port;
app.use(cors());//para las los frontend que trabajan con cors (opcional)
app.use(bodyParser.json({limit: '50mb'}));//el limite 
app.use(bodyParser.urlencoded({ limit: '50mb', 'extended': 'true', parameterLimit: 50000  }));//el limite 

client.on('qr', qr => {
    fs.writeFileSync('./components/last.qr',qr);
});

client.on('authenticated', (session) => {
    console.log("AUTH!");
    sessionCfg = session;
    fs.writeFile(SESSION_FILE_PATH, JSON.stringify(session), function(err) {
        if (err) {
            console.error(err);
        }
        authed=true;
    });
    try{
        fs.unlinkSync('./components/last.qr')
    }catch(err){}
});

client.on('auth_failure', () => {
    console.log("AUTH Failed !")
    sessionCfg = ""
    process.exit()
});

client.on('ready', () => {
    console.log('Client is ready!');
});

client.on('message', msg => {
    if(config.webhook.enabled){
        axios.post(config.webhook.path, {msg : msg})
    }
})
client.initialize();

const chatRoute = require('./components/chatting');
const groupRoute = require('./components/group');
const authRoute = require('./components/auth');
const contactRoute = require('./components/contact');

app.use(function(req,res,next){//función que atrapa la peticion hhtp e imprime en consola
    console.log(req.method + ' : ' + req.path);
    next();
});
/*Los componentes que se usan con su respectiva rutas o rounting*/
app.use('/auth',authRoute);
app.use('/chat',chatRoute);
app.use('/group',groupRoute);
app.use('/contact',contactRoute);

app.listen(port, () => {//para imprimir en consola el puerto que esta en la configuración
    console.log(`si es primera vez que ingresa: http://localhost:${port}/auth/getqr`)
    console.log(`Run: http://127.0.0.1:${port}`);
});