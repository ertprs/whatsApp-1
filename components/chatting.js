const router = require('express').Router();
var emojiByName = require('../emoji.json');
const {
    MessageMedia,
    Location
} = require("whatsapp-web.js");
const request = require('request')
const vuri = require('valid-url');
const fs = require('fs');

const mediadownloader = (url, path, callback) => {
    request.head(url, (err, res, body) => {
        request(url)
            .pipe(fs.createWriteStream(path))
            .on('close', callback)
    })
}

const verificarNum = (phone) => {
    while (phone.indexOf("+") >= 0 || phone.indexOf("-") >= 0 || phone.indexOf(" ") >= 0 || phone.indexOf("(") >= 0 || phone.indexOf(")") >= 0) {
        phone = phone.replace("+", "");
        phone = phone.replace("-", "");
        phone = phone.replace(" ", "");
        phone = phone.replace("(", "");
        phone = phone.replace(")", "");
    } //ciclo repetito para quitar todos los caracteres raros y solo dejarlo en números
    if (phone.startsWith("52") && !phone.startsWith("521")) //esto es para los numeros telefonicos de mexico que es el codigo 52, resulta que que es necesario aumentar el 1 al código del pais
        phone = phone.replace("52", "521");
    return phone;
}

const transformarIcon = (message) => { // Verifica si es que existe iconos  :icon: para transformarlo en emoticon
    var newMessage = ""; //nuevo mensaje
    var arrayWord = []; //array para separar el message por  :
    var missing = false; //variable bool para saber si se perdio el :
    arrayWord = message.split(":");
    if (arrayWord.length > 2) {
        for (var i = 0; i < arrayWord.length; i++) {
            if (emojiByName.hasOwnProperty(arrayWord[i])) { //pregunta si es que existe la propiedad en el emoji.json
                arrayWord[i] = emojiByName[arrayWord[i]]; //lo remplaza
                missing = false;
            } else {
                if (missing)
                    arrayWord[i] = ':' + arrayWord[i];
                missing = true;
            }
            newMessage = newMessage + arrayWord[i]; //concatena la nueva cadena
        }
    } else newMessage = message;
    return newMessage;
}

router.post('/sendmessage/:phone', async (req, res) => { //método para enviar un solo mensaje de texto
    let phone = req.params.phone; //campo obligatorio
    let message = req.body.message; //campo obligatorio
    phone = verificarNum(phone);
    message = transformarIcon(message);
    if (phone == undefined || message == undefined) {
        res.send({
            status: "error",
            message: "Porfavor revisar que el Número o el Mensaje sean validos"
        })
    } else {
        client.sendMessage(phone + '@c.us', message).then((response) => {
            res.send({
                status: 'success',
                message: 'Message successfully sent to ' + phone
            })
        }).catch(error => {
            console.log('caught', error.message);
            let messageT = error.message + " desde la apiPort:" + global.port + " en el método sendmessage";
            client.sendMessage(global.numTecnico + '@c.us', messageT).then((response) => {
                res.send({
                    status: 'success',
                    message: 'Message unsuccessfully send'
                })
            });
        });
    }
});

router.post('/sendmedia/:phone', async (req, res) => { //método para enviar imagenes, docuemtos, audios
    var base64regex = /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/;
    let phone = req.params.phone; // campo obligatorio
    let data = req.body.media; //campo obligatorio
    let caption = req.body.caption; // campo opcional
    let type = req.body.type; // campo obligatorio
    let filename = req.body.title; // campo opcional
    let message = req.body.message; //campo opcional

    phone = verificarNum(phone);
    if (phone == undefined || data == undefined) {
        res.send({
            status: "error",
            message: "Porfavor revisar que el Número o el Archivo sean validos"
        })
    } else {
        if (base64regex.test(data)) { //comprueba si es que el campo image que contiene la base64 es correcta
            let media = new MessageMedia(type, data, filename); //el messageMedia recive 3 parametros: el mimetype(applicacion o image o audio),la base 64, y el nombre del archivo(opcional)
            if (type.indexOf("application") >= 0) { //si en la cadena type se encuentra la palabra application pasa por el if caso contrario pasa por el else debido a que es una image o audio
                if (message != "" && message != undefined) {
                    message = transformarIcon(message); //transformar si es que tiene iconos
                    client.sendMessage(phone + '@c.us', message).then((response) => {
                        client.sendMessage(phone + '@c.us', media).then((response) => {
                            res.send({
                                status: 'success',
                                message: 'MediaMessage successfully sent to ' + phone
                            })
                        });
                    }).catch(error => {
                        console.log('caught', error.message);
                        let messageT = error.message + " desde la apiPort:" + global.port + " en el método sendmedia para el tipo: " + type;
                        client.sendMessage(global.numTecnico + '@c.us', messageT).then((response) => {
                            res.send({
                                status: 'success',
                                message: 'Message unsuccessfully send'
                            })
                        });
                    });
                } else {
                    client.sendMessage(phone + '@c.us', media).then((response) => {
                        res.send({
                            status: 'success',
                            message: 'MediaMessage successfully sent to ' + phone
                        })
                    }).catch(error => {
                        console.log('caught', error.message);
                        let messageT = error.message + " desde la apiPort:" + global.port + " en el método sendmedia para el tipo: " + type;
                        client.sendMessage(global.numTecnico + '@c.us', messageT).then((response) => {
                            res.send({
                                status: 'success',
                                message: 'Message unsuccessfully send'
                            })
                        });
                    });
                }
            } else {
                if (caption != "" && caption != undefined)
                    caption = transformarIcon(caption); //transformar si es que tiene iconos
                client.sendMessage(phone + '@c.us', media, {
                    caption: caption || "",
                    sendAudioAsVoice: true
                }).then((response) => {
                    res.send({
                        status: 'success',
                        message: 'MediaMessage successfully sent to ' + phone
                    })
                }).catch(error => {
                    console.log('caught', error.message);
                    let messageT = error.message + " desde la apiPort:" + global.port + " en el método sendmedia para el tipo: " + type;
                    client.sendMessage(global.numTecnico + '@c.us', messageT).then((response) => {
                        res.send({
                            status: 'error',
                            message: 'Message unsuccessfully send'
                        })
                    });
                });
            }
        }else res.send({
            status: "error",
            message: "Mal dato al transformar a la base64"
        })
    }
});

router.post('/sendlocation/:phone', async (req, res) => {
    let phone = req.params.phone;
    let latitude = req.body.latitude;
    let longitude = req.body.longitude;
    let desc = req.body.description;

    phone = verificarNum(phone);
    if (phone == undefined || latitude == undefined || longitude == undefined) {
        res.send({
            status: "error",
            message: "please enter valid phone, latitude and longitude"
        })
    } else {
        let loc = new Location(latitude, longitude, desc || "");
        client.sendMessage(phone + '@c.us', loc).then((response) => {
            if (response.id.fromMe) {
                res.send({
                    status: 'success',
                    message: 'Location successfully sent to ' + phone
                })
            }
        });
    }
});

router.get('/getchatbyid/:phone', async (req, res) => {
    let phone = req.params.phone;
    phone = verificarNum(phone);

    if (phone == undefined) {
        res.send({
            status: "error",
            message: "please enter valid phone number"
        });
    } else {
        client.getChatById(phone + "@c.us").then((chat) => {
            res.send({
                status: "success",
                message: chat
            });
        }).catch(() => {
            console.error("getchaterror")
            res.send({
                status: "error",
                message: "getchaterror"
            })
        })
    }
});

router.get('/getchats', async (req, res) => {
    client.getChats().then((chats) => {
        res.send({
            status: "success",
            message: chats
        });
    }).catch(() => {
        res.send({
            status: "error",
            message: "getchatserror"
        })
    })
});

router.post('/sendmultmessage/', async (req, res) => { //método para enviar un mensaje de texto a varios usuarios
    let phones = req.body.phones; //campo obligatorio
    let message = req.body.message; //campo obligatorio

    var controlNumeros = [];
    var auxControl = {
        phone: "",
        status: ""
    }
    if (phones.length > 0) {
        message = transformarIcon(message);
        for (var i = 0; i < phones.length; i++) {
            auxControl = {
                phone: "",
                status: ""
            }
            phones[i] = verificarNum(phones[i]);
            client.sendMessage(phones[i] + '@c.us', message).then((response) => {
                client.isRegisteredUser(response.id.remote.user + '@c.us').then((is) => {
                    auxControl.phone = response.id.remote.user;
                    if (is)
                        auxControl.status = "success";
                    else
                        auxControl.status = "is not a whatsapp user";
                    controlNumeros.push(JSON.parse(JSON.stringify(auxControl))); //guarda en el array los números y el resultado del envio
                    if (controlNumeros.length == phones.length) {
                        res.send({
                            status: 'success',
                            message: controlNumeros
                        })
                    }
                })
            })
        }
    } else
        res.send({
            status: 'error',
            message: 'Lista de Números vacia'
        });
});

module.exports = router;