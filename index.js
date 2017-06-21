// Load Express
const express = require('express')
var body_parser = require('body-parser')
const app = express()
app.use(body_parser.json())
// Load colors
var colors = require('colors')
// Load SQL database
var sqlite3 = require('sqlite3').verbose()
var db = new sqlite3.Database('messages.db')
var botkit = require('botkit')
var os = require('os')
var settings = require('./settings.js')

// Initialize Mailgun
var mailgun = require('mailgun-js')({apiKey: settings.mailgun_api_key, domain: settings.mail_domain});
var controller = null;
var bot = null;
var bot_utility = require("./bot_utility.js");

initialize();


function initialize(){
    // Function to start the RTM server.
    function startRtm(callback) {
        bot = controller.spawn({
            token: settings.slack_bot_key
        }).startRTM(function(err,bot,payload) {
            if (err) {
                console.log('❌ Failed to start RTM')
                return setTimeout(startRtm, 60000);
            }
            console.log("✅ RTM started!".green.bold);
            callback();
        });
    }

    function loadChannelId(callback){
        // Load channel ID
        bot.api.channels.list({}, (err, list) => {
            list = list.channels;
            for(i in list){
                if (list[i].name == settings.channel.name){
                    settings.channel.id = list[i].id;
                    break;
                }
            }
            console.log("✅ Channel ID loaded".green.bold);
            callback();
        });
    }

    function loadAgentIds(callback){
        // Get all agent's user ID in slack
        bot.api.users.list({}, function(err, list){
            list = list.members;
            for(i in list){
                for (k in settings.agents){
                    if (settings.agents[k].name == list[i].name){
                        settings.agents[k].id = list[i].id;
                        // If we want online notification
                        if(settings.online_notification){
                            bot.say({
                                text:"🤖 LightingChat bot is now online!\nヽ(´ー｀)┌ Welcome! Agent " + list[i].name,
                                channel:list[i].id
                            })
                        }
                        
                    }
                }
            }
            console.log("✅ User IDs loaded".green.bold);
            callback();
        })
    }

    // Initialize Botkit
    controller = botkit.slackbot({
        debug: false
    });

    // Restart RTM once disconnected
    controller.on('rtm_close', (bot, err) => {
        startRtm(()=>{});
    });
    startRtm(()=>{
        loadChannelId(()=>{
            loadAgentIds(()=>{
                console.log("⚡⚡ LightningChat initialized!".yellow.bold.italic)
            });
        });
    });
}

// Used to initialize database
// db.serialize(function () {
//     try {
//         db.run('CREATE TABLE sessions (id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT, identifier TEXT, status INT, offline_time INT, assigned_agent TEXT)');
//         db.run('CREATE TABLE messages (id INTEGER PRIMARY KEY AUTOINCREMENT, identifier TEXT, sender TEXT, message TEXT)');
//     } catch (e) {
//         console.log('Already initialized');
//     }
// })

controller.hears(['^list$'], 'direct_message,direct_mention,mention', function(bot, message) {
   bot_utility.reactToMessage(bot, message);
    db.serialize(() => {
        db.all('SELECT * FROM sessions WHERE status=1', function (err, rows) {
            var msg = "*Open Sessions:*\n";
            for(i in rows){
                if(isOffline(rows[i].offline_time)){
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
});

controller.hears(['^listall$'], 'direct_message,direct_mention,mention', function(bot, message) {
    bot_utility.reactToMessage(bot, message);
    db.serialize(() => {
        db.all('SELECT * FROM sessions', function (err, rows) {
            var msg = "*All Sessions:*\n";
            for(i in rows){
                if(isOffline(rows[i].offline_time)){
                    msg += "> (*#" + rows[i].id + "*) - " +  rows[i].identifier + " (offline)";
                } else {
                    msg += "> (*#" + rows[i].id + "*) - " +   rows[i].identifier + " (online)";
                }
                if(rows[i].assigned_agent == ""){
                    msg += " NOT ASSIGNED ";
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
                msg += "\nThere are no open sessions.\n";
            }
            // msg += "------------------------------\n"
            msg += "Type `switch {id}` to join a chat. ex. `switch 1`\n"
            msg += "Type `close {id}` to close a session. ex. `close 1`\n"
            msg += "Type `help` for more information.\n"
            bot.reply(message, msg);
        })
    })
});

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

controller.hears(
    ['^reply ([0-9]*) (.*)$'],
    'direct_message,direct_mention,mention',
    (bot, message) => {
        bot_utility.reactToMessage(bot, message);
        var session_id = message.match[1];
        var message = message;
        getSessionInfo(session_id, (info) => {
            if(info){
                if(info.status == 1){
                    bot.api.users.info({user: message.user}, (error, response) => {
                        let {name, real_name} = response.user;
                        console.log(name);
                        sendMessage(info.identifier, name, message.match[2], () => {
                            bot_utility.sendConfirmation(bot, message);
                            if(isOffline(info.offline_time) && info.email != "none"){
                                var data = {
                                    from: 'Lightning <lightning@bot.amacss.org>',
                                    to: info.email,
                                    subject: 'New reply from AMACSS',
                                    text: "New reply from AMACSS - \n" +
                                          message.match[2] + "\n" + 
                                          "Please do not reply to this email. To see your chat history, visit amacss.org"
                                };
                                
                                mailgun.messages().send(data, function (error, body) {
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

controller.hears(
    ['^history (.*)$'],
    'direct_message,direct_mention,mention',
    (bot, message) => {
        bot_utility.reactToMessage(bot, message);
        var session_id = message.match[1];
        getSessionInfo(session_id, (info) => {
            if(info){
                getAllMessages(info.identifier, (messages) => {
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
                    if(isOffline(info.offline_time)){
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




controller.hears(['^assign (.*) (.*)$'], 'direct_message,direct_mention,mention', (bot, message) => {
    bot_utility.reactToMessage(bot, message);
    console.log(message.match);
    // Check if agent is valid
    var agent_name = message.match[2];
    var session_id  = message.match[1];
    if(findAgent(agent_name)){
        // Check if session exists
        getSessionInfo(session_id, (info) => {
            if(info){
                assignSessionAgent(session_id, agent_name, () => {
                    bot.reply(message, 'Session `' + session_id + '` assigned to ' + agent_name);
                });
            } else {
                bot.reply(message, 'Session `' + session_id + '` does not exist :(');
            }
        })
    } else {
        bot.reply(message, 'Agent `' + agent_name + '` does not exist :(');
    }
});

function findAgent(name) {
    for(i in settings.agents){
        if (settings.agents[i].name == name){
            return settings.agents[i];
        } else {
            return false;
        }
    }
}

controller.hears(['status'], 'direct_message,direct_mention,mention', (bot, message) => {
    bot_utility.reactToMessage(bot, message);
    controller.storage.users.get(message.user, (err, user) => {
        bot.api.users.info({user: message.user}, (error, response) => {
            let {name, real_name} = response.user;
            if(findAgent(name)){
                // User is an agent
                bot.reply(message, "Welcome back, agent " + name + "!");
            } else {
                bot.reply(message, "Hi! " + name + ", unfortunately you are not an authenticated agent.\nPlease contact admin for more details.");
            }
        });
    });
});

function isOffline(time){
    let current_time = Math.round(+new Date()/1000);
    if(time < current_time){
        return true;
    } else {
        return false;
    }
}

function getSessionInfo(id, callback){
    db.serialize(() => {
        var stmt = db.prepare('SELECT * FROM sessions WHERE id=?');
        stmt.get(id, (err, row) => {
            if(row){
                callback(row);
            } else {
                callback(false);
            }
        });
    });
}

function getSessionInfoByIdentifier(identifier, callback){
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

function closeSession(id, callback){
    db.serialize(() => {
        var stmt = db.prepare('UPDATE sessions SET status=0 WHERE id=?');
        stmt.run(id);
        callback();
    });
}

function openSession(id, callback){
    db.serialize(() => {
        var stmt = db.prepare('UPDATE sessions SET status=1 WHERE id=?');
        stmt.run(id);
        callback();
    });
}

function assignSessionAgent(id, agent, callback){
    db.serialize(() => {
        var stmt = db.prepare('UPDATE sessions SET assigned_agent=? WHERE id=?');
        stmt.run(agent, id);
        agent_id = findAgent(agent).id;
        getSessionInfo(id, (info) => {
            if(info){
                sendMessage(info.identifier, agent, "You are assigned to " + agent + ". How can we help?", () => {});
            } else {
                console.log("This should **NEVER** happen :)");
            }
        })
        
        callback();
    });
}

function validateEmail(email) {
    var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
}

function setSessionEmailByIdentifier(identifier, email, callback){
    if(validateEmail(email)){
        db.serialize(() => {
            var stmt = db.prepare('UPDATE sessions SET email=? WHERE identifier=?');
            stmt.run(email, identifier);
            callback(true);
        });
    } else {
        callback(false);
    }
}

function getAllMessages(id, callback){
    db.serialize(() => {
        var stmt = db.prepare('SELECT * FROM messages WHERE identifier=?');
        stmt.all(id, (err, rows) => {
            callback(rows);
        })
    });
}

controller.hears(['close (.*)'], 'direct_message,direct_mention,mention', function(bot, message) {
    bot_utility.reactToMessage(bot, message);
    getSessionInfo(message.match[1], (info) => {
        if(info){
            closeSession(message.match[1], () => {
                bot.reply(message, "Session `#" + message.match[1] + "` closed.");
            })
        } else {
            bot.reply(message, "Session does not exist :(");
        }
    })
});

controller.hears(['open (.*)'], 'direct_message,direct_mention,mention', function(bot, message) {
    bot_utility.reactToMessage(bot, message);
    getSessionInfo(message.match[1], (info) => {
        if(info){
            openSession(message.match[1], () => {
                bot.reply(message, "Session `#" + message.match[1] + "` reopened.");
            })
        } else {
            bot.reply(message, "Session does not exist :(");
        }
    })
});


app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

app.post('/sessions', (req, res) => {
    var res = res;
    db.serialize(() => {
        var session_id = genUUID();
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
        var stmt = db.prepare('SELECT * FROM sessions WHERE identifier=?');
        stmt.get(req.params.session_id, (err, row) => {
            if(row){
                var stmt = db.prepare('SELECT * FROM messages WHERE identifier=?');
                stmt.all(req.params.session_id, (err, rows) => {
                    res.send(rows);
                })
            } else {
                res.send({status:"notfound"});
            }
        })
        
    })
})

app.post('/sessions/:session_id/assigned_agent/:agent_name', (req, res) => {
    getSessionInfoByIdentifier(req.params.session_id, (info) => {
        if(info){
            if(info.assigned_agent){
                res.send({status:"already assigned"});
            } else {
                agent = findAgent(req.params.agent_name);
                if(agent){
                    assignSessionAgent(info.id, agent.name, () => {
                        res.send({status:"ok"});
                    })
                } else {
                    res.send({status:"notfound"});
                }
            }
        } else {
            res.send({status:"notfound"});
        }
    })
});

// Get session information
app.get('/sessions/:session_id/info', (req, res) => {
    getSessionInfoByIdentifier(req.params.session_id, (info) => {
        if(info){
            res.send(info);
        } else {
            res.send({status:"notfound"});
        }
    })
})

// Set email for the session
app.post('/sessions/:session_id/email', (req, res) => {
    if(req.body.email){
        setSessionEmailByIdentifier(req.params.session_id, req.body.email, (result) => {
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

// Post a new message to session
app.post('/sessions/:session_id', (req, res) => {
    if(req.body.message){
        getSessionInfoByIdentifier(req.params.session_id, (info) => {
            if(info){
                // Insert message as guest
                sendMessage(req.params.session_id, "visitor", req.body.message, () => {
                    console.log("Message recieved " + req.params.session_id + " " + req.body.message);
                    res.send({status:"ok"});
                    // Post message to relevent channel
                    if(info.assigned_agent != ""){
                        // If there is an assigned agent
                        var agent_info = findAgent(info.assigned_agent);
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

function sendMessage(session_id, user_id, message, callback){
    db.serialize(() => {
        var stmt = db.prepare('INSERT INTO messages (identifier, sender, message) VALUES (?,?,?)');
        stmt.run(session_id, user_id, message);
        stmt.finalize();
        // console.log("New session " + session_id + " opened.");
        callback();
    })
}

// Heartbeat for session
app.get('/sessions/:session_id/heartbeat', (req, res) => {
    // Update offline_time for the session
    db.serialize(() => {
        var session_id = req.params.session_id;
        var stmt = db.prepare('UPDATE sessions SET offline_time=? WHERE identifier=?');
        var offline_time = Math.round(+new Date()/1000) + 10;
        stmt.run(offline_time, session_id);
        stmt.finalize();
        res.send(JSON.stringify({status:'ok'}));
    })
})

app.listen(settings.app_port, function () {
    console.log('LightningChat running on port ' + settings.app_port);
})

function genUUID(){
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
        return v.toString(16);
    });
}



// Check to see if a session is offline, maybe send an email?
setInterval(() => {
    let current_time = Math.round(+new Date()/1000);
    db.serialize(() => {
        db.each('SELECT * FROM sessions WHERE status=1 AND offline_time < ' + current_time, function (err, row) {
            // console.log(row.identifier + " is now offline.");
        })
    })
}, 1000);