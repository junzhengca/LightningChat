'use strict';

global.navigator = {
    userAgent: 'node.js'
};

const settings    = require('./settings');
const mysql       = require('mysql');
const express     = require('express');
const app         = express();
const server      = require('http').Server(app);
const socket_io   = require('socket.io')(server);
const path        = require('path');

const Socket = require('./lib/Socket');

let sockets = [];

server.listen(settings.app_port);



app.use('/', express.static(path.join(__dirname, 'static')));

socket_io.on('connection', function(socket){
    sockets.push(new Socket(socket));
});