class MessageProcessor {

    constructor(socket){
        this.socket = socket;
    }

    newMessage(msg){
        console.log(msg.message);
        this.socket.sendMessage({ message: "hi" });
    }
}

module.exports = MessageProcessor;