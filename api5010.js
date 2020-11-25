const express = require("express");
const bodyParser = require("body-parser");
const fs = require('fs');
const axios = require('axios');
const config = require('./configs/config5010.json');
const app = express();
const cors = require('cors');
const {Client} = require('whatsapp-web.js');

/** rutas del componentes */
const chatRoute = require('./components/chatting');
const groupRoute = require('./components/group');
const authRoute = require('./components/auth');
const contactRoute = require('./components/contact');

/*Variables Globales*/
global.port = process.env.PORT || config.port;
global.passwordAdmin = config.passwordAdmin;
global.numTecnico = config.numTecnico;
global.responsable = config.responsable;
global.last_qr;

/*Variables Locales*/
var SESSION_FILE_PATH = "";
var sessionCfg = false;

/*Configuraciones del express*/
app.use(cors()); //para las los frontend que trabajan con cors (opcional)
app.use(bodyParser.json({limit: '100mb'})); //el limite 
app.use(bodyParser.urlencoded({limit: '100mb','extended': 'true',parameterLimit: 100000})); //el limite 
app.use(express.json());
process.title = "whatsapp-node-api";
/**Main Proyect */

if (fs.existsSync(`./sesiones/session${port}.json`)) {
    SESSION_FILE_PATH = `./sesiones/session${port}.json`;
    sessionCfg = require(SESSION_FILE_PATH);
}

reiniciarCliente();

/*Eventos On Cliente*/
client.on('qr', qr => {
    console.log(fechaServer(), 'No existe una sesión activa, se procede a crear una nueva');
    console.log(fechaServer(), `Ingrese o recargue la página: http://localhost:${global.port}/auth/getqr`);
    if (qr != global.last_qr) {
        global.last_qr = qr;
    }
});

client.on('authenticated', (session) => {
    console.log(fechaServer(), "AUTH!");
    SESSION_FILE_PATH = `./sesiones/session${global.port}.json`;
    if (fs.existsSync(`./sesiones/session${global.port}.json`)) {
        sessionCfg = session;
    } else {
        fs.writeFile(SESSION_FILE_PATH, JSON.stringify(session), function (err) {
            if (err) {
                console.error(err);
            }
            global.authed = true;
        });
    }
});

client.on('auth_failure', () => {
    console.log(fechaServer(), "AUTH Failed!");
    sessionCfg = false;
    /**Parte de borrado automatico Método 1 estilo gian*/
    /*if (fs.existsSync(`./sesiones/session${global.port}.json`)) {
        fs.unlinkSync(`./sesiones/session${global.port}.json`);
    }*/
    /*if(config.webhook.enabled){
        axios.post(config.webhook.path+config.responsable, {message : "Buen día, le informamos que la autentificación ha fallado. \n *!Por favor intente logearse de nuevo usando un nuevo código QR! *"})
    }*/
    /**Parte de borrado manual Método 2 estilo jairo */
    /*if(config.webhook.enabled){
        axios.post(config.webhook.path+config.responsable+'?number=Phone03', {message : "Buen día, le informamos que la autentificación ha fallado. \n*!Por favor verificar que su dispositivo base "+config.numBase +" este encendio y conectado a una red con acceso a internet.*\nComunicar lo solucionado a\nhttps://wa.me/"+config.numTecnico +"MUCHAS GRACIAS"});
        if(config.personaAux != null)
        axios.post(config.webhook.path+config.personaAux+'?number=Phone03', {message : "Buen día, le informamos que la autentificación ha fallado. \n*!Por favor verificar que su dispositivo base "+config.numBase +" este encendio y conectado a una red con acceso a internet*"});
        axios.post(config.webhook.path+config.numTecnico+'?number=Phone03', {message : "La autentificación ha fallado en la base celular "+ config.numBase + " desde la apiPort:" + config.port});
    }*/
});

client.on('ready', () => {
    console.log(fechaServer(), 'Client is ready!');
});

client.on('disconnected', (reason) => {
    console.log(fechaServer(), 'Client was logged out', reason);
    
    if(config.webhook.enabled){
        axios.post(config.webhook.path+config.responsable, {message : "Buen día, le informamos que la base celular se ha desconectado. \n *!Por favor intente logearse de nuevo!*"})
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
    if (batteryInfo.battery <= config.avisocarga && !batteryInfo.plugged) {
        console.log(fechaServer(), "La carga descendió del " + config.avisocarga + "%");
        let message = "Buen día, le informamos que la base celular reporta un descenso de carga eléctrica al " + batteryInfo.battery + "% \n *!Por favor conectar el cargador!*";
        client.sendMessage(config.responsable + '@c.us', message);
        if (config.personaAux != null)
            client.sendMessage(config.personaAux + '@c.us', message);
        if(batteryInfo.battery==0 && config.webhook.enabled){
            console.log("igual a 0");
            axios.post(config.webhook.path+config.responsable, {message : "Buen día, le informamos que la base celular se ha descargado completamente, los mensajes se quedaran en espera. \n *!Por favor cargar el celular!*"})
        }
            
    }
});

/**función que atrapar la peticion hhtp e imprime en consola */
app.use(function (req, res, next) {
    console.log(fechaServer(), "Petición=> " + req.method + ': ' + req.path);
    next();
});

/*Los componentes que se usan con su respectiva rutas o rounting*/
app.use('/auth', authRoute);
app.use('/chat', chatRoute);
app.use('/group', groupRoute);
app.use('/contact', contactRoute);

app.listen(global.port, () => { //para imprimir en consola el puerto que esta en la configuración
    console.log(fechaServer(), `Run: http://127.0.0.1:${global.port}`);
});

//método para capturar la fecha, hora del servidor, y le da formato para visualar en consola
const fechaServer = () => {
    let fecha = new Date();
    let fechaM = fecha.getMonth() + 1;
    let fechaD = fecha.getDate();
    let fechaH = fecha.getHours();
    let fechaMin = fecha.getMinutes();
    let fechaSg = fecha.getMinutes();
    if (fechaM < 10)
        fechaM = "0" + fechaM;
    if (fechaD < 10)
        fechaD = "0" + fechaD;
    if (fechaH < 10)
        fechaH = "0" + fechaH;
    if (fechaMin < 10)
        fechaMin = "0" + fechaMin;
    if (fechaSg < 10)
        fechaSg = "0" + fechaSg;
    var strFecha = "[" + fecha.getFullYear() + "-" + fechaM + "-" + fechaD + " " + fechaH + ":" + fechaMin + ":" + fechaSg + "]";
    return strFecha;
}

//método para reiniciar las sessiones de manera automatica
function reiniciarCliente() {
    global.authed = false;
    global.client = new Client({
        puppeteer: { 
            executablePath:"C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
            headless: true, 
            args:['--no-sandbox','--disable-setuid-sandbox','--unhandled-rejections=strict'] 
        },
        session: sessionCfg,
        takeoverOnConflict: true,
        authTimeoutMs: 20000,
        restartOnAuthFail: true
    });
    client.initialize();
}