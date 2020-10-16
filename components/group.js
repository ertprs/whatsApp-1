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

router.post('/sendmessage/:chatname', async (req, res) => {
    let chatname = req.params.chatname;
    let message = req.body.message;

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
                            client.sendMessage(chat.id._serialized, media).then((response) => {
                                if (response.id.fromMe) {
                                    res.send({
                                        status: 'success',
                                        message: 'MediaMessage successfully sent to ' + chatname
                                    })
                                }
                            });
                            if (message != "" || message != undefined)
                                client.sendMessage(chat.id._serialized, message).then((response) => {});
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