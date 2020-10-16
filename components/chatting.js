const router = require('express').Router();
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
    }
    return phone;
}

router.post('/sendmessage/:phone', async (req, res) => { //método para enviar un mensaje de texto
    let phone = req.params.phone; //campo obligatorio
    let message = req.body.message; //campo obligatorio
    phone = verificarNum(phone);
    if (phone == undefined || message == undefined) {
        res.send({
            status: "error",
            message: "please enter valid phone and message"
        })
    } else {
        client.sendMessage(phone + '@c.us', message).then((response) => {
            if (response.id.fromMe) {
                res.send({
                    status: 'success',
                    message: 'Message successfully sent to ' + phone
                })
            }  
        }).catch(error => {
            console.log('caught', error.message);
            let message = error.message + " desde la apiPort:"+global.port;
            client.sendMessage(global.numTecnico + '@c.us',  message ).then((response) => {
                res.send({
                    status: 'error',
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
            message: "please enter valid phone and base64/url"
        })
    } else {
        if (base64regex.test(data)) { //comprueba si es que el campo image que contiene la base64 es correcta
            let media = new MessageMedia(type, data, filename); //el messageMedia recive 3 parametros: el mimetype(applicacion o image o audio),la base 64, y el nombre del archivo(opcional)
            if (type.indexOf("application") >= 0) { //si en la cadena type se encuentra la palabra application pasa por el if caso contrario pasa por el else debido a que es una image o audio
                client.sendMessage(phone + '@c.us', media).then((response) => {
                    if (response.id.fromMe) {
                        res.send({
                            status: 'success',
                            message: 'MediaMessage successfully sent to ' + phone
                        })
                    }
                });
                if (message != ""||message !=undefined)
                client.sendMessage(phone + '@c.us', message).then((response) => {});
            } else {
                client.sendMessage(phone + '@c.us', media, {
                    caption: caption || "",
                    sendAudioAsVoice: true
                }).then((response) => {
                    if (response.id.fromMe) {
                        res.send({
                            status: 'success',
                            message: 'MediaMessage successfully sent to ' + phone
                        })
                    }
                }).catch(error => {
                    console.log('caught', error.message);
                    let message = error.message + " desde la apiPort:"+global.port;
                    client.sendMessage(global.numTecnico + '@c.us',  message ).then((response) => {
                        res.send({
                            status: 'error',
                            message: 'Message unsuccessfully send'
                        })
                    });
                });
            }
        } else if (vuri.isWebUri(data)) {
            if (!fs.existsSync('./temp')) {
                await fs.mkdirSync('./temp');
            }
            var path = './temp/' + data.split("/").slice(-1)[0]
            mediadownloader(data, path, () => {
                let media = MessageMedia.fromFilePath(path);
                if (type.indexOf("application") >= 0) {
                    client.sendMessage(phone + '@c.us', media).then((response) => {
                        if (response.id.fromMe) {
                            res.send({
                                status: 'success',
                                message: 'MediaMessage successfully sent to ' + phone
                            })
                        }
                    });
                } else {
                    client.sendMessage(phone + '@c.us', media, {
                        caption: caption || "",
                        sendAudioAsVoice: true
                    }).then((response) => {
                        if (response.id.fromMe) {
                            res.send({
                                status: 'success',
                                message: 'MediaMessage successfully sent to ' + phone
                            })
                        }
                    });
                }
            })
        } else {
            res.send({
                status: 'error',
                message: 'Invalid URL/Base64 Encoded Media'
            })
        }
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

module.exports = router;