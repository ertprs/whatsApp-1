const router = require('express').Router();
const {
    MessageMedia,
    Location
} = require("whatsapp-web.js");
var emojiByName = require('../emoji.json');
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

router.post('/sendmessage/:chatname', async (req, res) => {
    let chatname = req.params.chatname;
    let message = req.body.message;
    if (chatname == undefined || message == undefined) {
        res.send({
            status: "error",
            message: "Porfavor revisar que el nombre del grupo o el mensaje sean datos validos"
        })
    } else {
        client.getChats().then((datac) => {
            datac.forEach(chat => {
                if (chat.id.server === "g.us" && chat.name === chatname) {
                    message = transformarIcon(message);
                    client.sendMessage(chat.id._serialized, message).then((response) => {
                        res.send({
                            status: 'success',
                            message: 'MediaMessage successfully sent to ' + chatname
                        })
                    }).catch(error => {
                        console.log('caught', error.message);
                        let messageT = error.message + " desde la apiPort:" + global.port + " en el método sendmessage group";
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
            message: "Porfavor revisar que el nombre del grupo o el archivo sean datos validos"
        })
    } else {
        if (base64regex.test(data)) {
            client.getChats().then((datac) => {
                datac.forEach(chat => {
                    if (chat.id.server === "g.us" && chat.name === chatname) {
                        let media = new MessageMedia(type, data, filename);
                        if (type.indexOf("application") >= 0) {
                            if (message != "" && message != undefined) {
                                message = transformarIcon(message); //transformar si es que tiene iconos
                                client.sendMessage(chat.id._serialized, message).then((response) => {
                                    client.sendMessage(chat.id._serialized, media).then((response) => {
                                        res.send({
                                            status: 'success',
                                            message: 'MediaMessage successfully sent to ' + chatname
                                        })
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
                            } else {
                                client.sendMessage(chat.id._serialized, media).then((response) => {
                                    res.send({
                                        status: 'success',
                                        message: 'MediaMessage successfully sent to ' + chatname
                                    })
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
                        } else {
                            if (caption != "" && caption != undefined)
                                caption = transformarIcon(caption); //transformar si es que tiene iconos
                            client.sendMessage(chat.id._serialized, media, {
                                caption: caption || "",
                                sendAudioAsVoice: true
                            }).then((response) => {
                                res.send({
                                    status: 'success',
                                    message: 'MediaMessage successfully sent to ' + chatname
                                })
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
        } else res.send({
            status: "error",
            message: "Mal dato al transformar a la base64"
        })
    }
});

router.post('/sendGroup/:chatname', async (req, res) => {
    var base64regex = /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/;
    let chatname = req.params.chatname; //campo obligatorio
    let data = req.body.media; //campo obligatorio
    let caption = req.body.caption; // campo opcional
    let type = req.body.type; // campo obligatorio
    let filename = req.body.title; // campo opcional
    let message = req.body.message; //campo opcional

    if (chatname == undefined) {
        res.send({
            status: "error",
            message: "Porfavor revisar que el nombre del grupo"
        })
    } else {
        if (data != undefined && data !="") {
            if (base64regex.test(data)) {
                client.getChats().then((datac) => {
                    datac.forEach(chat => {
                        if (chat.id.server === "g.us" && chat.name === chatname) {
                            let media = new MessageMedia(type, data, filename);
                            if (type.indexOf("application") >= 0) {
                                if (message != "" && message != undefined) {
                                    message = transformarIcon(message); //transformar si es que tiene iconos
                                    client.sendMessage(chat.id._serialized, message).then((response) => {
                                        client.sendMessage(chat.id._serialized, media).then((response) => {
                                            res.send({
                                                status: 'success',
                                                message: 'messageGroup successfully sent to ' + chatname
                                            })
                                        });
                                    }).catch(error => {
                                        console.log('caught', error.message);
                                        let messageT = error.message + " desde la apiPort:" + global.port + " en el método messageGroup para el tipo: " + type;
                                        client.sendMessage(global.numTecnico + '@c.us', messageT).then((response) => {
                                            res.send({
                                                status: 'success',
                                                message: 'Message unsuccessfully send'
                                            })
                                        });
                                    });
                                } else {
                                    client.sendMessage(chat.id._serialized, media).then((response) => {
                                        res.send({
                                            status: 'success',
                                            message: 'MessageGroup successfully sent to ' + chatname
                                        })
                                    }).catch(error => {
                                        console.log('caught', error.message);
                                        let messageT = error.message + " desde la apiPort:" + global.port + " en el método messageGroup para el tipo: " + type;
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
                                client.sendMessage(chat.id._serialized, media, {
                                    caption: caption || "",
                                    sendAudioAsVoice: true
                                }).then((response) => {
                                    res.send({
                                        status: 'success',
                                        message: 'MessageGroup successfully sent to ' + chatname
                                    })
                                }).catch(error => {
                                    console.log('caught', error.message);
                                    let messageT = error.message + " desde la apiPort:" + global.port + " en el método meesageGroup para el tipo: " + type;
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
            } else res.send({
                status: "error",
                message: "Mal dato al transformar a la base64"
            })
        } else {
            if (message != undefined && message!="") {
                message = transformarIcon(message); //transformar si es que tiene iconos
                client.getChats().then((datac) => {
                    datac.forEach(chat => {
                        if (chat.id.server === "g.us" && chat.name === chatname) {
                            client.sendMessage(chat.id._serialized, message).then((response) => {
                                res.send({
                                    status: 'success',
                                    message: 'MessageGroup successfully sent to ' + chatname
                                })
                            }).catch(error => {
                                console.log('caught', error.message);
                                let messageT = error.message + " desde la apiPort:" + global.port + " en el método messageGroup";
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
            } else res.send({
                status: "error",
                message: "Mal dato al transformar a la base64"
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
        let pasar = false;
        client.getChats().then((data) => {
            data.forEach(chat => {
                if (chat.id.server === "g.us" && chat.name === chatname) {
                    pasar = true;
                    res.send({
                        status: "success",
                        isGroup: chat.isGroup,
                        isReadOnly: chat.isReadOnly
                    })
                }
            });
            if (!pasar)
                res.send({
                    status: "error",
                    isGroup: false,
                    isReadOnly: false
                })
        });
    }
});

module.exports = router;