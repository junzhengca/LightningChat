module.exports = (app, util, db, bot) => {
  // Start a new session
  app.post('/sessions', (req, res) => {
    var res = res;
    db.serialize(() => {
      var session_id = util.genUUID()
      var stmt = db.prepare('INSERT INTO sessions (email, identifier, status, offline_time, assigned_agent) VALUES (?,?,?,?,?)');
      var offline_time = Math.round(+new Date()/1000) + 10;
      stmt.run("none", session_id, 1, offline_time, "");
      stmt.finalize();
      console.log("New session " + session_id + " opened.");
      res.send({session_id:session_id});
    })
  })

  // Get all messages associated with session_id
  app.get('/sessions/:session_id', (req, res) => {
    db.serialize(() => {
      var stmt = db.prepare('SELECT * FROM sessions WHERE identifier=?')
      stmt.get(req.params.session_id, (err, row) => {
        if(row){
          var stmt = db.prepare('SELECT * FROM messages WHERE identifier=?')
          stmt.all(req.params.session_id, (err, rows) => {
              res.send(rows)
          })
        } else {
          res.send({status:"notfound"})
        }
      })
    })
  })

  // Get session information
  app.get('/sessions/:session_id/info', (req, res) => {
      util.getSessionInfoByIdentifier(req.params.session_id, (info) => {
          if(info){
              res.send(info);
          } else {
              res.send({status:"notfound"});
          }
      })
  })

  // Assign a new agent
  app.post('/sessions/:session_id/assigned_agent/:agent_name', (req, res) => {
    console.log("POST request at /sessions/:session_id/asigned_agent/:agent_name".green.bold)
    console.log("$session_id = " + req.params.session_id)
    console.log("$agent_name = " + req.params.agent_name)

    util.getSessionInfoByIdentifier(req.params.session_id, (info) => {
      if(info){
        if(info.assigned_agent){
          res.send({status:"already assigned"});
        } else {
          agent = util.findAgent(req.params.agent_name);
          if(agent){
            util.assignSessionAgent(info.id, agent.name, () => {
              console.log("RESPONDED ok".green.bold)
              res.send({status:"ok"});
            })
          } else {
            console.log("RESPONDED agent notfound".red.bold)
            res.send({status:"notfound"});
          }
        }
      } else {
        console.log("RESPONDED session notfound".red.bold)
        res.send({status:"notfound"});
      }
    })
  });

  // Set email for the session
  app.post('/sessions/:session_id/email', (req, res) => {
    if(req.body.email){
      util.setSessionEmailByIdentifier(req.params.session_id, req.body.email, (result) => {
        if(result){
          res.send({status:"ok"});
        } else {
          res.send({status:"error"});
        }
      })
    } else {
      // Bad request
      res.send({status:"error"});
    }
  });

  // Heartbeat for session
  app.get('/sessions/:session_id/heartbeat', (req, res) => {
    // Update offline_time for the session
    db.serialize(() => {
      var session_id = req.params.session_id;
      var stmt = db.prepare('UPDATE sessions SET offline_time=? WHERE identifier=?');
      var offline_time = Math.round(+new Date()/1000) + 10;
      stmt.run(offline_time, session_id);
      stmt.finalize();
      res.send(JSON.stringify({
        status:'ok',
        online: util.getOnlineStatus()
      }));
    })
  })

  // Post a new message to session
  app.post('/sessions/:session_id', (req, res) => {
    if(req.body.message){
      util.getSessionInfoByIdentifier(req.params.session_id, (info) => {
        if(info){
          // Insert message as guest
          util.sendMessage(req.params.session_id, "visitor", req.body.message, () => {
            console.log("Message recieved " + req.params.session_id + " " + req.body.message);
            res.send({status:"ok"});
            // Post message to relevent channel
            if(info.assigned_agent != ""){
              // If there is an assigned agent
              var agent_info = util.findAgent(info.assigned_agent);
              if(agent_info){
                // Post message to agent's channel
                bot.say({
                    text:'*visitor* from *session `' + info.id + '`*\n'
                    + "> " + req.body.message
                    + "\nReply by typing `reply " + info.id + " {your message}`",
                    channel:agent_info.id
                })
              }
            } else {
              // If there is no assigned agent, we attempt to post a message to specified channel
              bot.say({
                text:"*visitor* from *session `" + info.id + "`* \n"
                     + "> " + req.body.message + "\n"
                     + "*NO AGENT ASSIGNED!*\n"
                     + "Assign yourself by typing `assign " + info.id  +" <your username>`",
                channel:settings.channel.id
              })
            }
          });
        } else {
          // Session does not exist
          res.send({status:"error"});
        }
      })
    } else {
        res.send({status:"error"});
    }
  });

}
