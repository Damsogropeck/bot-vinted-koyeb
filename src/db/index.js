
const Database = require('easy-json-database');
const db = new Database('./data/db.json');

if (!db.has('subscriptions')) db.set('subscriptions', []);

module.exports = db;
