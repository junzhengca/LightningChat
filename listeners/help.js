module.exports = (controller, util, bot_utility, db) => {
  controller.hears(['^help$'], 'direct_message,direct_mention,mention', (bot, message) => {
    bot_utility.reactToMessage(bot, message);
    controller.storage.users.get(message.user, function(err, user) {
      bot.api.users.info({user: message.user}, (error, response) => {
        let {name, real_name} = response.user;
        console.log(name, real_name);
      })
      bot.reply(message,
`*Basic commands*
\`list\` - Get a list of open sessions
\`listall\` - Get a list of all sessions
\`history {id}\` - Preview a session's chat history
\`close {id}\` - Close a session
\`open {id}\` - Reopen a session
\`status\` - See your current status
\`assign {id} {agent}\` - Assign session to another agent
\`reply {id} {message}\` - Reply to a session
----------------------------------------------
*LightningChat (c) Jun Z (junthehacker) 2017*
*Built with ❤️ at the University of Toronto at Scarborough*
`);
    });
  });
}
