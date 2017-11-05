var socket_io    = require('socket.io-client');
var keypair      = require('keypair');
var rsa          = require('node-rsa');
var $            = require('jquery');

class App {
    constructor(config){
        this.serverAddress = config.serverAddress;
        this.keypair = keypair({ bits: 1024 });
        this.serverPublicKey = null;
        this.socket = null;
        this._initializeSocket();
        this.ready = false;
        this.serverReady = false;
    }

    _initializeSocket(){
        this.socket = socket_io(this.serverAddress);
        var self = this;
        // Key transmission
        this.socket.on('public key', (key) => {
            self.serverPublicKey = key;
            self._devLog("Server public key received " + "<pre>" + self.serverPublicKey + "</pre>");
            // We are ready
            self.ready = true;
            self.socket.emit('ready', {});
            self._devLog("Client is ready ...");
        });
        this.socket.on('connect', () => {
            self.socket.emit('public key', self.keypair.public);
            self._devLog("Client public key transmitted " + "<pre>" + self.keypair.public + "</pre>");
        });
        this.socket.on('ready', () => {
           self.serverReady = true;
           self._devLog("Server is ready ...");
        });

        this.socket.on('message', (message) => {
            self._devLog("Encrypted message received " + message);
            var key = new rsa(self.keypair.private);
            message = JSON.parse(key.decrypt(message));
            self._devLog("Message decrypted " + JSON.stringify(message));
        });
    }

    sendMessage(message){
        if(this.serverReady && this.ready){
            message = JSON.stringify(message);
            var key = new rsa(this.serverPublicKey);
            this.socket.emit('message', key.encrypt(message, 'base64'));
            this._devLog("Encrypted message sent: " + key.encrypt("test", 'base64'));
        } else {
            this._devLog("App is not ready yet");
        }
    }

    _devLog(msg){
        $("#lightning-chat-dev-log").append("<div><span>"+ new Date().getTime() + "</span>" + msg + "</div>");
    }

}

window.LightningChat = App;