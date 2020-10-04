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

router.post('/sendmessage/:phone', async (req, res) => {//método para enviar un mensaje de texto
    let phone = req.params.phone; //campo obligatorio
    let message = req.body.message; //campo obligatorio

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
        });
    }
});

router.post('/sendimage/:phone', async (req, res) => {//método para enviar un imagen 
    var base64regex = /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/;
    let phone = req.params.phone; //campos obligatorio
    let image = req.body.media; //campo obligatorio
    let caption = req.body.caption; // campo opcional
    let type = req.body.type; //campo obligatorio

    if (phone == undefined || image == undefined) {
        res.send({
            status: "error",
            message: "please enter valid phone and base64/url of image"
        })
    } else {
        if (base64regex.test(image)) {//comprueba si es que el campo image que contiene la base64 es correcta
            let media = new MessageMedia(type.tostring(), image); //el messageMedia recive 3 parametros: el mimetype(en este caso image/jpeg),la base 64, y el parametro opcional nombre 
            client.sendMessage(phone + '@c.us', media, {
                caption: caption || ""
            }).then((response) => {
                if (response.id.fromMe) {
                    res.send({
                        status: 'success',
                        message: 'MediaMessage successfully sent to ' + phone
                    })
                }
            });
        } else if (vuri.isWebUri(image)) {
            if (!fs.existsSync('./temp')) {
                await fs.mkdirSync('./temp');
            }
            var path = './temp/' + image.split("/").slice(-1)[0]
            mediadownloader(image, path, () => {
                let media = MessageMedia.fromFilePath(path);
                client.sendMessage(phone + '@c.us', media, {
                    caption: caption || ""
                }).then((response) => {
                    if (response.id.fromMe) {
                        res.send({
                            status: 'success',
                            message: 'MediaMessage successfully sent to ' + phone
                        })
                    }
                });
            })
        } else {
            res.send({
                status: 'error',
                message: 'Invalid URL/Base64 Encoded Media'
            })
        }
    }
});

router.post('/sendfile/:phone', async (req, res) => {//método para enviar un pdf doc, excel 
    var base64regex = /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/;
    let phone = req.params.phone;//campo obligatorio
    let doc = req.body.media;// campo obligatorio
    let type = req.body.type; //campo obligatorio
    let filename = req.body.title; //campo opcional pero recomendable

    if (phone == undefined || doc == undefined) {
        res.send({
            status: "error",
            message: "please enter valid phone and base64/url of image"
        })
    } else {
        if (base64regex.test(doc)) {//comprueba si es que el campo image que contiene la base64 es correcta
            let media = new MessageMedia(type, doc, filename);//el messageMedia recive 3 parametros: el mimetype(en este caso applicacion/pdf),la base 64, y el nombre del archivo
            client.sendMessage(phone + '@c.us', media).then((response) => {
                if (response.id.fromMe) {
                    res.send({
                        status: 'success',
                        message: 'MediaMessage successfully sent to ' + phone
                    })
                }
            });
        } else if (vuri.isWebUri(doc)) {
            if (!fs.existsSync('./temp')) {
                await fs.mkdirSync('./temp');
            }
            var path = './temp/' + doc.split("/").slice(-1)[0]
            mediadownloader(doc, path, () => {
                let media = MessageMedia.fromFilePath(path);
                client.sendMessage(phone + '@c.us', media).then((response) => {
                    if (response.id.fromMe) {
                        res.send({
                            status: 'success',
                            message: 'MediaMessage successfully sent to ' + phone
                        })
                    }
                });
            })
        } else {
            res.send({
                status: 'error',
                message: 'Invalid URL/Base64 Encoded Media'
            })
        }
    }
});

router.post('/sendmedia/:phone', async (req, res) => {//método para enviar imagenes, docuemtos, audios
    var base64regex = /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/;
    let phone = req.params.phone;// campo obligatorio
    let data = req.body.media;//campo obligatorio
    let caption = req.body.caption;// campo opcional
    let type = req.body.type;// campo obligatorio
    let filename = req.body.title;// campo opcional


    if (phone == undefined || data == undefined) {
        res.send({
            status: "error",
            message: "please enter valid phone and base64/url"
        })
    } else {
        if (base64regex.test(data)) {//comprueba si es que el campo image que contiene la base64 es correcta
            let media = new MessageMedia(type, data, filename);//el messageMedia recive 3 parametros: el mimetype(applicacion o image o audio),la base 64, y el nombre del archivo(opcional)
            if (type.indexOf("application") >= 0) {//si en la cadena type se encuentra la palabra application pasa por el if caso contrario pasa por el else debido a que es una image o audio
                client.sendMessage(phone + '@c.us', media).then((response) => {
                    if (response.id.fromMe) {
                        res.send({
                            status: 'success',
                            message: 'MediaMessage successfully sent to ' + phone
                        })
                    }
                });
            } else {
                client.sendMessage(phone + '@c.us', media, {caption: caption || "",sendAudioAsVoice: true}).then((response) => {
                    if (response.id.fromMe) {
                        res.send({
                            status: 'success',
                            message: 'MediaMessage successfully sent to ' + phone
                        })
                    }
                }).catch(error => {
                    console.log('caught', error.message);
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