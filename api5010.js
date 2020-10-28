const express = require("express");
const bodyParser = require("body-parser");
const fs = require('fs');
const axios = require('axios');
const cors = require('cors');
const config = require('./configs/config5010.json'); //la debo de sacar con el http-server
const {Client} = require('whatsapp-web.js');
global.port = process.env.PORT || config.port;
global.passwordAdmin = config.passwordAdmin;
global.numTecnico= config.numTecnico;
global.responsable = config.responsable;

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
    if(batteryInfo.battery<=config.avisocarga && !batteryInfo.plugged){
        console.log(fechaServer(), "La carga descendió del "+config.avisocarga+"%");
        let message="Buen día, le informamos que la base celular reporta un descenso de carga eléctrica al "+batteryInfo.battery+"% \n *!Por favor conectar el cargador!*" ;
        client.sendMessage(config.responsable + '@c.us',  message );
        if(config.personaAux!=null)
            client.sendMessage(config.personaAux + '@c.us',  message );
    }
    
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
    let fecha= new Date();
    let fechaM=fecha.getMonth()+1;
    let fechaD= fecha.getDate();
    let fechaH= fecha.getHours();
    let fechaMin= fecha.getMinutes();
    let fechaSg= fecha.getMinutes();
    if(fechaM<10)
    fechaM="0"+fechaM;
    if(fechaD<10)
    fechaD="0"+fechaD;
    if(fechaH<10)
    fechaH="0"+fechaH;
    if(fechaMin<10)
    fechaMin="0"+fechaMin;
    if(fechaSg<10)
    fechaSg="0"+fechaSg;

    var strFecha= "["+fecha.getFullYear() + "-" +fechaM+ "-" + fechaD + " " +fechaH +":"+fechaMin+ ":"+ fechaSg +"]";
    return strFecha;
}