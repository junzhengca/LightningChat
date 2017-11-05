'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var socket_io = require('socket.io-client');
var keypair = require('keypair');
var rsa = require('node-rsa');
var $ = require('jquery');

var App = function () {
    function App(config) {
        _classCallCheck(this, App);

        this.serverAddress = config.serverAddress;
        this.keypair = keypair({ bits: 1024 });
        this.serverPublicKey = null;
        this.socket = null;
        this._initializeSocket();
        this.ready = false;
        this.serverReady = false;
    }

    _createClass(App, [{
        key: '_initializeSocket',
        value: function _initializeSocket() {
            this.socket = socket_io(this.serverAddress);
            var self = this;
            // Key transmission
            this.socket.on('public key', function (key) {
                self.serverPublicKey = key;
                self._devLog("Server public key received " + "<pre>" + self.serverPublicKey + "</pre>");
                // We are ready
                self.ready = true;
                self.socket.emit('ready', {});
                self._devLog("Client is ready ...");
            });
            this.socket.on('connect', function () {
                self.socket.emit('public key', self.keypair.public);
                self._devLog("Client public key transmitted " + "<pre>" + self.keypair.public + "</pre>");
            });
            this.socket.on('ready', function () {
                self.serverReady = true;
                self._devLog("Server is ready ...");
            });

            this.socket.on('message', function (message) {
                self._devLog("Encrypted message received " + message);
                var key = new rsa(self.keypair.private);
                message = JSON.parse(key.decrypt(message));
                self._devLog("Message decrypted " + JSON.stringify(message));
            });
        }
    }, {
        key: 'sendMessage',
        value: function sendMessage(message) {
            if (this.serverReady && this.ready) {
                message = JSON.stringify(message);
                var key = new rsa(this.serverPublicKey);
                this.socket.emit('message', key.encrypt(message, 'base64'));
                this._devLog("Encrypted message sent: " + key.encrypt("test", 'base64'));
            } else {
                this._devLog("App is not ready yet");
            }
        }
    }, {
        key: '_devLog',
        value: function _devLog(msg) {
            $("#lightning-chat-dev-log").append("<div><span>" + new Date().getTime() + "</span>" + msg + "</div>");
        }
    }]);

    return App;
}();

window.LightningChat = App;
//# sourceMappingURL=lightningchat.js.map