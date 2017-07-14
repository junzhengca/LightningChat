module.exports = (db, settings) => {
  // Return true if input time is expired
  this.isOffline = function(time){
    let current_time = Math.round(+new Date()/1000);
    if(time < current_time){
      return true;
    } else {
      return false;
    }
  }

  this.getSessionInfo = function(id, callback){
    db.serialize(() => {
      var stmt = db.prepare('SELECT * FROM sessions WHERE id=?')
      stmt.get(id, (err, row) => {
        if(row){
            callback(row);
        } else {
            callback(false);
        }
      })
    })
  }

  this.sendMessage = function(session_id, user_id, message, callback){
    db.serialize(() => {
      var stmt = db.prepare('INSERT INTO messages (identifier, sender, message) VALUES (?,?,?)')
      stmt.run(session_id, user_id, message)
      stmt.finalize()
      // console.log("New session " + session_id + " opened.");
      callback()
    })
  }

  this.assignSessionAgent = function(id, agent, callback){
    db.serialize(() => {
      var stmt = db.prepare('UPDATE sessions SET assigned_agent=? WHERE id=?')
      stmt.run(agent, id)
      agent_id = this.findAgent(agent).id
      this.getSessionInfo(id, (info) => {
        if(info){
          this.sendMessage(info.identifier, agent, "You are assigned to " + agent + ". How can we help?", () => {})
        } else {
          console.log("This should **NEVER** happen :)")
        }
      })

      callback()
    })
  }

  this.findAgent = function(name) {
    for(i in settings.agents){
      // console.log(i);
      // console.log("record name " + settings.agents[i].name);
      // console.log("input " + name);
      if (settings.agents[i].name == name){
          return settings.agents[i];
      }
    }
    return false;
  }

  this.genUUID = function(){
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8)
        return v.toString(16)
    })
  }


  this.openSession = function(id, callback){
    db.serialize(() => {
      var stmt = db.prepare('UPDATE sessions SET status=1 WHERE id=?');
      stmt.run(id)
      callback()
    })
  }

  this.closeSession = function(id, callback){
    db.serialize(() => {
      var stmt = db.prepare('UPDATE sessions SET status=0 WHERE id=?')
      stmt.run(id)
      callback()
    })
  }

  this.getAllMessages = function(id, callback){
    db.serialize(() => {
      var stmt = db.prepare('SELECT * FROM messages WHERE identifier=?');
      stmt.all(id, (err, rows) => {
          callback(rows)
      })
    });
  }

  this.getSessionInfoByIdentifier = function(identifier, callback){
    db.serialize(() => {
      var stmt = db.prepare('SELECT * FROM sessions WHERE identifier=?');
      stmt.get(identifier, (err, row) => {
        if(row){
          callback(row);
        } else {
          callback(false);
        }
      });
    });
  }

  this.setSessionEmailByIdentifier = function(identifier, email, callback){
    if(this.validateEmail(email)){
      db.serialize(() => {
        var stmt = db.prepare('UPDATE sessions SET email=? WHERE identifier=?');
        stmt.run(email, identifier);
        callback(true);
      });
    } else {
      callback(false);
    }
  }



  this.validateEmail = function(email) {
    var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
  }


  return this
}
