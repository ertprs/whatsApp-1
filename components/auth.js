const router = require('express').Router();
const fs = require('fs');
router.get('/checkauth', async (req, res) => {
    client.getState().then((data) => {
        res.send(data)
    }).catch((err) => {
        if (err) {
            res.send("DISCONNECTED")
            try {
                if (fs.existsSync(`./sesiones/session${global.port}.json`)) {
                    fs.unlinkSync(`./sesiones/session${global.port}.json`);
                }
            } catch (err) {
                console.log(err)
            }
        }
    })
});

router.get('/getqr', (req, res) => {
    var qrjs = fs.readFileSync('components/qrcode.js');
    fs.readFile(`./components/last${global.port}.qr`, (err, last_qr) => {
        fs.readFile(`sesiones/session${global.port}.json`, (serr, sessiondata) => {
            if (err && sessiondata) {
                res.write("<html><body><h2>Already Authenticated</h2></body></html>");
                res.end();
            } else if (!err && serr) {
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

router.post('/logout', async (req, res) => {
    let password = req.body.password; //campo obligatorio
    client.getState().then((data) => {
        if (data == "CONNECTED") {
            if (password == global.passwordAdmin) {
                let message = "Cliente cerro sesión desde la apiPort: " + global.port;
                client.sendMessage(global.numTecnico + '@c.us', message).then((response) => {
                    res.send({
                        status: 'success',
                        message: 'Acaba de cerrar la sesión'
                    })
                    client.logout();
                    if (fs.existsSync(`./sesiones/session${global.port}.json`)) {
                        fs.unlinkSync(`./sesiones/session${global.port}.json`);
                    }
                });
            } else {
                let message = "Intento fallido de cerrar sesión en su cuenta";
                client.sendMessage(global.responsable + '@c.us', message).then((response) => {
                    if (response.id.fromMe) {
                        res.send({
                            status: 'error',
                            message: 'No se pudo cerrar sesión, contraseña incorrecta'
                        })
                    }
                });
            }
        }
    }).catch((err) => {
        if (err) {
            res.send("DISCONNECTED");
            try {
                if (fs.existsSync(`./sesiones/session${global.port}.json`)) {
                    fs.unlinkSync(`./sesiones/session${global.port}.json`);
                }
            } catch (err) {
                console.log(err)
            }
        }
    })
});

module.exports = router;