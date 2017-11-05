const rsa        = require('node-rsa');

class Message {
    constructor(message){
        this.message = JSON.parse(message);
    }

    encrypt(pub_key){
        var EncryptedMessage = require('./EncryptedMessage');
        var key = new rsa(pub_key);
        return new EncryptedMessage(key.encrypt(JSON.stringify(this.message), 'base64'), null);
    }
}

module.exports = Message;