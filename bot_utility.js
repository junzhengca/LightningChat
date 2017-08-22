module.exports = {
    reactToMessage: function(bot, message){
        bot.api.reactions.add({
            timestamp: message.ts,
            channel: message.channel,
            name: 'white_check_mark',
        }, (err, res) => {
            if (err) {
                bot.botkit.log('Failed to add emoji reaction :('.red, err)
            }
        })
    },
    sendConfirmation: function(bot, message){
        bot.api.reactions.add({
            timestamp: message.ts,
            channel: message.channel,
            name: 'ok',
        }, (err, res) => {
            if (err) {
                bot.botkit.log('Failed to add emoji reaction :('.red, err)
            }
        })
    }
}