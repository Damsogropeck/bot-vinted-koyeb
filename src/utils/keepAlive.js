const express = require('express');
const app = express();

app.get('/', (req, res) => res.send('✅ Bot Vinted is alive'));

function keepAlive() {
  app.listen(4000, () => console.log('✅ Serveur Express actif sur le port 4000 !'));
}

module.exports = keepAlive;
