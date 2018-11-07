const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const constants = require('./config/constants');
const cors = require('cors');
const ConnectionHandler = require('./logic/connection-handler');

const connectionHandler = new ConnectionHandler(io);

app.use(cors());

app.use((req, res, next) => {
    req.io = io;
    req.connectionHandler = connectionHandler;

    next();
});

app.use('/', express.static( __dirname + '/static'));

app.get('/constants', (req, res) => {
    res.send(JSON.stringify(constants));
});

const port = process.env.PORT || 1234;

http.listen(port, () => {
    console.log(`Server listening at port ${port}`);
});
