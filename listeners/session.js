module.exports = (controller, util, bot_utility, db) => {
  controller.hears(['close (.*)'], 'direct_message,direct_mention,mention', function(bot, message) {
    bot_utility.reactToMessage(bot, message);
    util.getSessionInfo(message.match[1], (info) => {
      if(info){
        util.closeSession(message.match[1], () => {
          bot.reply(message, "Session `#" + message.match[1] + "` closed.");
        })
      } else {
        bot.reply(message, "Session does not exist :(");
      }
    })
  })

  controller.hears(['open (.*)'], 'direct_message,direct_mention,mention', function(bot, message) {
    bot_utility.reactToMessage(bot, message);
    util.getSessionInfo(message.match[1], (info) => {
      if(info){
        util.openSession(message.match[1], () => {
          bot.reply(message, "Session `#" + message.match[1] + "` reopened.");
        })
      } else {
        bot.reply(message, "Session does not exist :(");
      }
    })
  })
}
