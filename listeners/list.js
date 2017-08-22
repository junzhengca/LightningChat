module.exports = (controller, util, bot_utility, db) => {
  controller.hears(['^list$'], 'direct_message,direct_mention,mention', function(bot, message) {
    bot_utility.reactToMessage(bot, message);
      db.serialize(() => {
        db.all('SELECT * FROM sessions WHERE status=1', function (err, rows) {
        var msg = "*Open Sessions:*\n";
        for(i in rows){
          if(util.isOffline(rows[i].offline_time)){
            msg += "> (*#" + rows[i].id + "*) - " +  rows[i].identifier + " (offline) ";
          } else {
            msg += "> (*#" + rows[i].id + "*) - " +   rows[i].identifier + " (online) ";
          }
          if(rows[i].assigned_agent == ""){
            msg += " NOT ASSIGNED\n";
          } else {
            msg += " (" + rows[i].assigned_agent + ")\n"
          }
        }
        if (rows.length == 0){
          msg += "\nThere are no open sessions.\n";
        }
        // msg += "------------------------------\n"
        msg += "Type `switch #{id}` to join a chat. ex. `switch #1`\n"
        msg += "Type `close #{id}` to close a session. ex. `close #1`\n"
        msg += "Type `help` for more information.\n"
        bot.reply(message, msg);
      })
    })
  })


  controller.hears(['^listall$'], 'direct_message,direct_mention,mention', function(bot, message) {
    bot_utility.reactToMessage(bot, message);
    db.serialize(() => {
      db.all('SELECT * FROM sessions', function (err, rows) {
        var msg = "*All Sessions:*\n"
        for(i in rows){
          if(util.isOffline(rows[i].offline_time)){
            msg += "> (*#" + rows[i].id + "*) - " +  rows[i].identifier + " (offline)"
          } else {
            msg += "> (*#" + rows[i].id + "*) - " +   rows[i].identifier + " (online)"
          }
          if(rows[i].assigned_agent == ""){
            msg += " NOT ASSIGNED "
          } else {
            msg += " (" + rows[i].assigned_agent + ") "
          }
          if(rows[i].status == 0){
            msg += " CLOSED\n"
          } else {
            msg += " *OPEN*\n"
          }
        }
        if (rows.length == 0){
          msg += "\nThere are no open sessions.\n"
        }
        // msg += "------------------------------\n"
        msg += "Type `switch {id}` to join a chat. ex. `switch 1`\n"
        msg += "Type `close {id}` to close a session. ex. `close 1`\n"
        msg += "Type `help` for more information.\n"
        bot.reply(message, msg)
      })
    })
  })
}
