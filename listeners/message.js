module.exports = (controller, util, bot_utility, db) => {
  controller.hears(
    ['^reply ([0-9]*) (.*)$'],
    'direct_message,direct_mention,mention',
    (bot, message) => {
      bot_utility.reactToMessage(bot, message);
      var session_id = message.match[1];
      var message = message;
      util.getSessionInfo(session_id, (info) => {
        if(info){
          if(info.status == 1){
            bot.api.users.info({user: message.user}, (error, response) => {
              let {name, real_name} = response.user;
              console.log(name);
              util.sendMessage(info.identifier, name, message.match[2], () => {
                bot_utility.sendConfirmation(bot, message);
                if(util.isOffline(info.offline_time) && info.email != "none"){
                  var data = {
                    from: 'Lightning <lightning@bot.amacss.org>',
                    to: info.email,
                    subject: 'New reply from AMACSS',
                    text: "New reply from AMACSS - \n" +
                          message.match[2] + "\n" +
                          "Please do not reply to this email. To see your chat history, visit amacss.org"
                  };

                  util.mailgun.messages().send(data, function (error, body) {
                    console.log(body);
                  });
                }
              });
            });
          } else {
              // Session already closed
              bot.reply(message, 'Session `' + session_id + '` is closed, please reopen it before replying.');
          }
        } else {
          // Cannot find session
          bot.reply(message, 'Session `' + session_id + '` does not exist :(');
        }
      })
    }
  )
}
