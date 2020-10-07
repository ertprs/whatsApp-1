const router = require('express').Router();
const fs = require('fs');
router.get('/checkauth', async (req, res) => {
    client.getState().then((data) => {
        console.log(data)
        res.send(data)
    }).catch((err) => {
        if(err){
            res.send("DISCONNECTED")
            try{
                fs.unlinkSync(`sesiones/session${global.port}.json`);
            }catch(err){console.log(err)}
        }
    })
});

router.get('/getqr', (req,res) => {
    var qrjs = fs.readFileSync('components/qrcode.js');
    fs.readFile(`./components/last${global.port}.qr`, (err,last_qr) => {
        fs.readFile(`sesiones/session${global.port}.json`, (serr, sessiondata) => {
            if(err && sessiondata){
                res.write("<html><body><h2>Already Authenticated</h2></body></html>");
                res.end();
            }else if(!err && serr){
                var page = `
                    <html>
                        <body>
                            <script>${qrjs}</script>
                            <div id="qrcode"></div>
                            <script type="text/javascript">
                                new QRCode(document.getElementById("qrcode"), "${last_qr}");
                            </script>
                        </body>
                    </html>
                `
                res.write(page)
                res.end();
            }
        })
    });
});

router.get('/logout', async (req, res) => {
    client.getState().then((data) => {
        if(data =="CONNECTED"){
            res.send("Acaba de cerrar la sesión")
            client.logout();
            if (fs.existsSync(`./sesiones/session${global.port}.json`)) {
                fs.unlinkSync(`./sesiones/session${global.port}.json`);
            }
            process.exit();
        }
    }).catch((err) => {
        if(err){
            res.send("DISCONNECTED")
            try{
                if (fs.existsSync(`./sesiones/session${global.port}.json`)) {
                    fs.unlinkSync(`./sesiones/session${global.port}.json`);
                }
            }catch(err){console.log(err)}
        }
    })
});

module.exports = router;