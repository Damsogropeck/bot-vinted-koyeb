
const express = require('express');
const server = express();

server.all('/', (req, res) => {
    res.send('Le bot fonctionne !');
});

function keepAlive() {
    server.listen(4000, () => {
        console.log('✅ Serveur Express actif sur le port 4000 !');
    });
}

module.exports = keepAlive;
