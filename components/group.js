const router = require('express').Router();
const {MessageMedia,Location} = require("whatsapp-web.js");
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
const transformarIcon = (message) => { // Verifica si es que existe iconos  :icon: para transformarlo en emoticon
    var newMessage = ""; //nuevo mensaje
    var arrayWord = []; //array para separar el message por  :
    var missing = false; //variable bool para saber si se perdio el :
    arrayWord = message.split(":");
    if (arrayWord.length > 3) {
        for (var i = 0; i < arrayWord.length; i++) {
            if (emojiByName.hasOwnProperty(arrayWord[i])) { //pregunta si es que existe la propiedad en el emoji.json
                arrayWord[i] = emojiByName[arrayWord[i]]; //lo remplaza
                missing = false;
            } else {
                if (!missing)
                    missing = true;
                else {
                    arrayWord[i] = ':' + arrayWord[i];
                    missing = false;
                }
            }
            newMessage = newMessage + arrayWord[i]; //concatena la nueva cadena
        }
    } else newMessage = message;
    return newMessage;
}

router.post('/sendmessage/:chatname', async (req, res) => {
    let chatname = req.params.chatname;
    let message = req.body.message;
    message = transformarIcon(message);
    if (chatname == undefined || message == undefined) {
        res.send({
            status: "error",
            message: "please enter valid chatname and message"
        })
    } else {
        client.getChats().then((data) => {
            data.forEach(chat => {
                if (chat.id.server === "g.us" && chat.name === chatname) {
                    client.sendMessage(chat.id._serialized, message).then((response) => {
                        if (response.id.fromMe) {
                            res.send({
                                status: 'success',
                                message: 'Message successfully send to ' + chatname
                            })
                        }
                    }).catch(error => {
                        console.log('caught', error.message);
                        let messageT = error.message + " desde la apiPort:" + global.port + " en el método sendmessage de group";
                        client.sendMessage(global.numTecnico + '@c.us', messageT).then((response) => {
                            res.send({
                                status: 'success',
                                message: 'Message unsuccessfully send'
                            })
                        });
                    });
                }
            });
        });
    }
});

router.post('/sendmedia/:chatname', async (req, res) => {
    var base64regex = /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/;
    let chatname = req.params.chatname; //campo obligatorio
    let data = req.body.media; //campo obligatorio
    let caption = req.body.caption; // campo opcional
    let type = req.body.type; // campo obligatorio
    let filename = req.body.title; // campo opcional
    let message = req.body.message; //campo opcional

    if (chatname == undefined || data == undefined) {
        res.send({
            status: "error",
            message: "please enter valid chatname and base64/url of file"
        })
    } else {
        if (base64regex.test(data)) {
            client.getChats().then((datac) => {
                datac.forEach(chat => {
                    if (chat.id.server === "g.us" && chat.name === chatname) {
                        if (!fs.existsSync('./temp')) {
                            fs.mkdirSync('./temp');
                        }
                        let media = new MessageMedia(type, data, filename);
                        if (type.indexOf("application") >= 0) {
                            if (message != ""&&message !=undefined){
                                message = transformarIcon(message); //transformar si es que tiene iconos
                                client.sendMessage(chat.id._serialized, message).then((response) => {
                                    client.sendMessage(chat.id._serialized, media).then((response) => {
                                        if (response.id.fromMe) {
                                            res.send({
                                                status: 'success',
                                                message: 'MediaMessage successfully sent to ' + chatname
                                            })
                                            
                                        }
                                    });
                                }).catch(error => {
                                    console.log('caught', error.message);
                                    let messageT = error.message + " desde la apiPort:" + global.port + " en el método sendmedia group para el tipo: " + type;
                                    client.sendMessage(global.numTecnico + '@c.us', messageT).then((response) => {
                                        res.send({
                                            status: 'success',
                                            message: 'Message unsuccessfully send'
                                        })
                                    });
                                });
                            }else{
                                client.sendMessage(chat.id._serialized, message).then((response) => {
                                    if (response.id.fromMe) {
                                        res.send({
                                            status: 'success',
                                            message: 'MediaMessage successfully sent to ' + chatname
                                        })
                                        
                                    }
                                });
                            }
                        } else {
                            client.sendMessage(chat.id._serialized, media, {
                                caption: caption || "",
                                sendAudioAsVoice: true
                            }).then((response) => {
                                if (response.id.fromMe) {
                                    res.send({
                                        status: 'success',
                                        message: 'MediaMessage successfully sent to ' + chatname
                                    })
                                }
                            }).catch(error => {
                                console.log('caught', error.message);
                                let messageT = error.message + " desde la apiPort:" + global.port + " en el método sendmedia group para el tipo: " + type;
                                client.sendMessage(global.numTecnico + '@c.us', messageT).then((response) => {
                                    res.send({
                                        status: 'success',
                                        message: 'Message unsuccessfully send'
                                    })
                                });
                            });
                        }
                    }
                });
            });
        } else if (vuri.isWebUri(data)) {
            var path = './temp/' + data.split("/").slice(-1)[0]
            client.getChats().then((datac) => {
                datac.forEach(chat => {
                    if (chat.id.server === "g.us" && chat.name === chatname) {
                        mediadownloader(data, path, () => {
                            let media = MessageMedia.fromFilePath(path);
                            client.sendMessage(chat.id._serialized, media, {
                                caption: caption || ""
                            }).then((response) => {
                                if (response.id.fromMe) {
                                    res.send({
                                        status: 'success',
                                        message: 'Message successfully send to ' + chatname
                                    })
                                }
                            });
                        });

                    }
                });
            });
        } else {
            res.send({
                status: 'error',
                message: 'Invalid URL/Base64 Encoded Media'
            })
        }
    }
});

router.post('/sendlocation/:chatname', async (req, res) => {
    let chatname = req.params.chatname;
    let latitude = req.body.latitude;
    let longitude = req.body.longitude;
    let desc = req.body.description;

    if (chatname == undefined || latitude == undefined || longitude == undefined) {
        res.send({
            status: "error",
            message: "please enter valid phone, latitude and longitude"
        })
    } else {
        client.getChats().then((data) => {
            data.forEach(chat => {
                if (chat.id.server === "g.us" && chat.name === chatname) {
                    let loc = new Location(latitude, longitude, desc || "");
                    client.sendMessage(chat.id._serialized, loc).then((response) => {
                        if (response.id.fromMe) {
                            res.send({
                                status: 'success',
                                message: 'Message successfully send to ' + chatname
                            })
                        }
                    });
                }
            });
        });
    }
});

router.get('/isregisteredgroup/:chatname', async (req, res) => {
    let chatname = req.params.chatname;

    if (chatname == undefined) {
        res.send({
            status: "error",
            message: "please enter valid chatname"
        })
    } else {
        let pasar=false;
        client.getChats().then((data) => {
            data.forEach(chat => {
                if (chat.id.server === "g.us" && chat.name === chatname) {
                    pasar=true;
                    res.send({
                        status:"success",
                        isGroup: chat.isGroup,
                        isReadOnly: chat.isReadOnly
                    })
                }
            });
            if(!pasar)
            res.send({
                status:"error",
                isGroup: false,
                isReadOnly: false
            })
        });
    }
});

module.exports = router;