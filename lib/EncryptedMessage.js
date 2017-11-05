const Message    = require('./Message');
const rsa        = require('node-rsa');

class EncryptedMessage {
    /**
     * Data is encrypted data, key is optional
     * @param data
     * @param key
     */
    constructor(data, key){
        this.data = data;
        this.key = key;
    }

    /**
     * Decrypt a message
     * @returns {boolean}
     */
    decrypt(){
        var key = new rsa(this.key);
        if(this.key){
            return new Message(key.decrypt(this.data).toString());
        } else {
            return false;
        }
    }
}

module.exports = EncryptedMessage;