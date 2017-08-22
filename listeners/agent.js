module.exports = (controller, util, bot_utility, db) => {
  controller.hears(['^assign (.*) (.*)$'], 'direct_message,direct_mention,mention', (bot, message) => {
    bot_utility.reactToMessage(bot, message);
    console.log(message.match);
    // Check if agent is valid
    var agent_name = message.match[2];
    var session_id  = message.match[1];
    if(util.findAgent(agent_name)){
      // Check if session exists
      util.getSessionInfo(session_id, (info) => {
        if(info){
          util.assignSessionAgent(session_id, agent_name, () => {
            bot.reply(message, 'Session `' + session_id + '` assigned to ' + agent_name);
          });
        } else {
          bot.reply(message, 'Session `' + session_id + '` does not exist :(');
        }
      })
    } else {
      bot.reply(message, 'Agent `' + agent_name + '` does not exist :(');
    }
  })

  controller.hears(['status'], 'direct_message,direct_mention,mention', (bot, message) => {
    bot_utility.reactToMessage(bot, message);
    controller.storage.users.get(message.user, (err, user) => {
      bot.api.users.info({user: message.user}, (error, response) => {
        let {name, real_name} = response.user;
        if(util.findAgent(name)){
          // User is an agent
          bot.reply(message, "Welcome back, agent " + name + "!");
        } else {
          bot.reply(message, "Hi! " + name + ", unfortunately you are not an authenticated agent.\nPlease contact admin for more details.");
        }
      });
    });
  });

  controller.hears(['offline'], 'direct_message,direct_mention,mention', (bot, message) => {
    bot_utility.reactToMessage(bot, message)
    controller.storage.users.get(message.user, (err, user) => {
      bot.api.users.info({user: message.user}, (error, response) => {
        util.setOnlineStatus(false)
        bot.reply(message, "LightningChat is now offline!")
        let {name, real_name} = response.user
        bot.say({
          text:"LightningChat is now offline, turned off by " + name,
          channel:util.getChannelId()
        })
      })
    })
  })

  controller.hears(['online'], 'direct_message,direct_mention,mention', (bot, message) => {
    bot_utility.reactToMessage(bot, message)
    controller.storage.users.get(message.user, (err, user) => {
      bot.api.users.info({user: message.user}, (error, response) => {
        util.setOnlineStatus(true)
        bot.reply(message, "LightningChat is now online!")
        let {name, real_name} = response.user
        bot.say({
          text:"LightningChat is now online, turned on by " + name,
          channel:util.getChannelId()
        })
      })
    })
  })
}
