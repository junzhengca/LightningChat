const akeypair   = require('akeypair');
const rsa        = require('node-rsa');
const MessageProcessor = require('./MessageProcessor');
const EncryptedMessage = require('./EncryptedMessage');
const Message = require('./Message');

class Socket {
    constructor(socket){
        this.socket          = socket;
        this.keypair         = null;
        this.clientPublicKey = null;
        this.ready = false;
        this.clientReady = false;
        this.messageProcessor = new MessageProcessor(this);

        let self = this;


        akeypair(function(err, pair){
            self.keypair = pair;
            // Transmit the public to client
            self.socket.emit('public key', self.keypair.public);
            self.ready = true;
            self.socket.emit('ready', {});
            console.log("Server is ready ...");
        });
        // Key transmission
        this.socket.on('public key', (key) => {
            self.clientPublicKey = key;
            console.log("Client public key received " + self.clientPublicKey);
        });

        this.socket.on('ready', () => {
            self.clientReady = true;
            console.log("Client is ready ...");
        });

        this.socket.on('message', (data) => {
            // We decrypt the message
            let message = new EncryptedMessage(data, self.keypair.private);
            self.messageProcessor.newMessage(message.decrypt());
        });
    }

    sendMessage(message){
        var messageBody = new Message(JSON.stringify(message)).encrypt(this.clientPublicKey);
        this.socket.emit('message', messageBody.data);
    }
}

module.exports = Socket;