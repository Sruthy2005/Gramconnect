const app = require('../app');
const connectDB = require('../config/db');

let isConnected = false;

async function handler(req, res) {
    if (!isConnected) {
        await connectDB();
        isConnected = true;
    }

    return app(req, res);
}

module.exports = handler;