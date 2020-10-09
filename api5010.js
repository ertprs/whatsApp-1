const express = require("express");
const bodyParser = require("body-parser");
const fs = require('fs');
const axios = require('axios');
const cors = require('cors');
const config = require('./configs/config5010.json'); //la debo de sacar con el http-server
const {Client} = require('whatsapp-web.js');
global.port = process.env.PORT || config.port;
var SESSION_FILE_PATH = "";
let sessionCfg;
if (fs.existsSync(`./sesiones/session${port}.json`)) {
    SESSION_FILE_PATH = `./sesiones/session${port}.json`;
    sessionCfg = require(SESSION_FILE_PATH);
}
process.title = "whatsapp-node-api";
global.client = new Client({
    puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--unhandled-rejections=strict']
    },
    session: sessionCfg
});
global.authed = false;
const app = express();

app.use(cors()); //para las los frontend que trabajan con cors (opcional)
app.use(bodyParser.json({limit: '100mb'})); //el limite 
app.use(bodyParser.urlencoded({limit: '100mb','extended': 'true',parameterLimit: 100000})); //el limite 

client.on('qr', qr => {
    fs.writeFileSync(`./components/last${global.port}.qr`, qr);
});

client.on('authenticated', (session) => {
    console.log(fechaServer(), "AUTH!");
    SESSION_FILE_PATH = `./sesiones/session${global.port}.json`;
    sessionCfg = session;
    fs.writeFile(SESSION_FILE_PATH, JSON.stringify(session), function (err) {
        if (err) {
            console.error(err);
        }
        global.authed = true;
    });
    try {
        fs.unlinkSync(`./components/last${global.port}.qr`);
    } catch (err) {}
});

client.on('auth_failure', () => {
    console.log(fechaServer(), "AUTH Failed!");
    console.log(`Ingresa de nuevo a: http://localhost:${global.port}/auth/getqr`);
    sessionCfg = "";
    if (fs.existsSync(`./sesiones/session${global.port}.json`)) {
        fs.unlinkSync(`./sesiones/session${global.port}.json`);
    }
});

client.on('ready', () => {
    console.log(fechaServer(), 'Client is ready!');
});

client.on('disconnected', (reason) => {
    console.log(fechaServer(), 'Client was logged out', reason);
    if (fs.existsSync(`./sesiones/session${global.port}.json`)) {
        fs.unlinkSync(`./sesiones/session${global.port}.json`);
    }
});

client.on('change_state', (state) => {
    console.log(fechaServer(), 'Cambio de estado a: ', state);
});

client.on('message_create', (msg) => {
    if (msg.fromMe) {
        console.log(fechaServer(), "Client send message");
    }
});

client.on('change_battery', (batteryInfo) => {
    // Battery percentage for attached device has changed
    const {battery,plugged} = batteryInfo;
    //console.log(fechaServer(), `Battery: ${battery}% - Charging? ${plugged}`);
    if(batteryInfo.battery<=20 && !batteryInfo.plugged)
    console.log(fechaServer(), "La carga descendió del 20%");
});
client.initialize();

const chatRoute = require('./components/chatting');
const groupRoute = require('./components/group');
const authRoute = require('./components/auth');
const contactRoute = require('./components/contact');

app.use(function (req, res, next) { //función que atrapa la peticion hhtp e imprime en consola
    console.log(fechaServer(), "Petición=> "+ req.method + ': ' + req.path);
    next();
});

/*Los componentes que se usan con su respectiva rutas o rounting*/
app.use('/auth', authRoute);
app.use('/chat', chatRoute);
app.use('/group', groupRoute);
app.use('/contact', contactRoute);

app.listen(global.port, () => { //para imprimir en consola el puerto que esta en la configuración
    console.log(`si es primera vez que ingresa: http://localhost:${global.port}/auth/getqr`)
    console.log(fechaServer(), `Run: http://127.0.0.1:${global.port}`);
});

const fechaServer = () => {
    var fecha= new Date();
    var strFecha= "["+fecha.getDate() + "-" +(fecha.getMonth()+1)+ "-" + fecha.getFullYear() + " " +fecha.getHours() +":"+fecha.getMinutes()+ ":"+ fecha.getSeconds() +"]";
    return strFecha;
}