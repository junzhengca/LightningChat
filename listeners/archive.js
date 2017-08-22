module.exports = (controller, util, bot_utility, db) => {
  controller.hears(
    ['^history (.*)$'],
    'direct_message,direct_mention,mention',
    (bot, message) => {
      bot_utility.reactToMessage(bot, message);
      var session_id = message.match[1];
      util.getSessionInfo(session_id, (info) => {
        if(info){
          util.getAllMessages(info.identifier, (messages) => {
            var msg = "*History for session #" + session_id + "*\n";
            msg += "*UUID:* " + info.identifier + "\n";
            msg += "*E-Mail:* " + info.email + "\n";
            msg += "*Message Count:* " + messages.length + " | ";
            msg += "*Agent:* " + info.assigned_agent + "\n";
            console.log(messages);
            // Check session open/closed status
            if(info.status == 0){
              msg += "*Status:* 🚫 CLOSED | "
            } else {
              msg += "*Status:* ✅ OPEN | "
            }
            // Check visitor online/offline status
            if(util.isOffline(info.offline_time)){
              msg += "OFFLINE\n";
            } else {
              msg += "ONLINE\n";
            }
            msg += "-----------------------------------\n"

            if(messages.length == 0){
              // No messages
              msg += "> No messages found";
            } else {
              for(i in messages){
                msg += "> *" + messages[i].sender + "*\n";
                msg += "> " + messages[i].message + "\n";
              }
            }
            bot.reply(message, msg);
          });
        } else {
          // Session does not exist
          bot.reply(message, 'Session `' + session_id + '` does not exist :(');
        }
      })
    }
  );
}
