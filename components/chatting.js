const router = require('express').Router();
const { MessageMedia, Location } = require("whatsapp-web.js");
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

router.post('/sendmessage/:phone', async (req,res) => {
    let phone = req.params.phone;
    let message = req.body.message;

    if(phone==undefined||message==undefined){
        res.send({status:"error",message:"please enter valid phone and message"})
    }else{
        client.sendMessage(phone+'@c.us',message).then((response)=>{
            if(response.id.fromMe){
                res.send({status:'success',message:'Message successfully sent to '+phone})
            }
        });
    }
});

router.post('/sendimage/:phone', async (req,res) => {
    var base64regex = /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/;

    let phone = req.params.phone;
    let image = req.body.image;
    let caption = req.body.caption;

    if(phone==undefined||image==undefined){
        res.send({status:"error",message:"please enter valid phone and base64/url of image"})
    }else{
        if(base64regex.test(image)){
            let media = new MessageMedia('image/png',image);
            client.sendMessage(phone+'@c.us',media,{caption:caption||""}).then((response)=>{
                if(response.id.fromMe){
                    res.send({status:'success',message:'MediaMessage successfully sent to '+phone})
                }
            });
        }else if(vuri.isWebUri(image)){
            if (!fs.existsSync('./temp')){
                await fs.mkdirSync('./temp');
            }
            var path = './temp/' + image.split("/").slice(-1)[0]
            mediadownloader(image,path,()=>{
                let media = MessageMedia.fromFilePath(path);
                client.sendMessage(phone+'@c.us',media,{caption:caption||""}).then((response)=>{
                    if(response.id.fromMe){
                        res.send({status:'success',message:'MediaMessage successfully sent to '+phone})
                    }
                });
            })
        }else{
            res.send({status:'error',message:'Invalid URL/Base64 Encoded Media'})
        }
    }
});

router.post('/sendpdf/:phone', async (req,res) => {
    var base64regex = /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/;

    let phone = req.params.phone;
    let doc = req.body.doc;

    if(phone==undefined||doc==undefined){
        res.send({status:"error",message:"please enter valid phone and base64/url of image"})
    }else{
        if(base64regex.test(doc)){
            let media = new MessageMedia('application/pdf',doc);
            client.sendMessage(phone+'@c.us',media).then((response)=>{
                if(response.id.fromMe){
                    res.send({status:'success',message:'MediaMessage successfully sent to '+phone})
                }
            });
        }else if(vuri.isWebUri(image)){
            if (!fs.existsSync('./temp')){
                await fs.mkdirSync('./temp');
            }
            var path = './temp/' + image.split("/").slice(-1)[0]
            mediadownloader(image,path,()=>{
                let media = MessageMedia.fromFilePath(path);
                client.sendMessage(phone+'@c.us',media,{caption:caption||""}).then((response)=>{
                    if(response.id.fromMe){
                        res.send({status:'success',message:'MediaMessage successfully sent to '+phone})
                    }
                });
            })
        }else{
            res.send({status:'error',message:'Invalid URL/Base64 Encoded Media'})
        }
    }
});

router.post('/sendvideo/:phone', async (req,res) => {
    var base64regex = /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/;

    let phone = req.params.phone;
    let video = req.body.video;
    let caption = req.body.caption;

    if(phone==undefined||video==undefined){
        res.send({status:"error",message:"please enter valid phone and base64/url of video"})
    }else{
        if(base64regex.test(video)){
            let media = new MessageMedia('video/mp4',video);
            client.sendMessage(phone+'@c.us',media,{caption:caption||""}).then((response)=>{
                if(response.id.fromMe){
                    res.send({status:'success',message:'MediaMessage successfully sent to '+phone})
                }
            });
        }else if(vuri.isWebUri(video)){
            if (!fs.existsSync('./temp')){
                await fs.mkdirSync('./temp');
            }
            var path = './temp/' + video.split("/").slice(-1)[0]
            mediadownloader(video,path,()=>{
                let media = MessageMedia.fromFilePath(path);
                client.sendMessage(phone+'@c.us',media,{caption:caption||""}).then((response)=>{
                    if(response.id.fromMe){
                        res.send({status:'success',message:'MediaMessage successfully sent to '+phone})
                    }
                });
            })
        }else{
            res.send({status:'error',message:'Invalid URL/Base64 Encoded Media'})
        }
    }
});

router.post('/sendlocation/:phone', async (req,res) => {
    let phone = req.params.phone;
    let latitude = req.body.latitude;
    let longitude = req.body.longitude;
    let desc = req.body.description;

    if(phone==undefined||latitude==undefined||longitude==undefined){
        res.send({status:"error",message:"please enter valid phone, latitude and longitude"})
    }else{
        let loc = new Location(latitude,longitude,desc||"");
        client.sendMessage(phone+'@c.us',loc).then((response)=>{
            if(response.id.fromMe){
                res.send({status:'success',message:'Location successfully sent to '+phone})
            }
        });
    }
});

router.get('/getchatbyid/:phone', async (req,res) => {
    let phone = req.params.phone;
    if(phone==undefined){
        res.send({status:"error",message:"please enter valid phone number"});
    }else{
        client.getChatById(phone+"@c.us").then((chat) => {
            res.send({ status:"success", message: chat});
        }).catch(() => {
            console.error("getchaterror")
            res.send({status:"error",message:"getchaterror"})
        })
    }
});

router.get('/getchats', async (req,res) => {
    client.getChats().then((chats) => {
        res.send({ status:"success", message: chats});
    }).catch(() => {
        res.send({status:"error",message:"getchatserror"})
    })
});

module.exports = router;