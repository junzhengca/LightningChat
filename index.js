// Load Express
const express = require('express')
var body_parser = require('body-parser')
const app = express()
app.use(body_parser.json())
app.use('/client', express.static('client'))
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

var util = require('./util')(db, settings)
console.log(util)

initialize()
require('./middlewares/cors')(app)
require('./listeners/list')(controller, util, bot_utility, db)
require('./listeners/help')(controller, util, bot_utility, db)
require('./listeners/message')(controller, util, bot_utility, db)
require('./listeners/agent')(controller, util, bot_utility, db)
require('./listeners/session')(controller, util, bot_utility, db)
require('./listeners/archive')(controller, util, bot_utility, db)


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
            console.log(settings.agents);
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
    console.log("POST request at /sessions/:session_id/asigned_agent/:agent_name".green.bold)
    console.log("$session_id = " + req.params.session_id)
    console.log("$agent_name = " + req.params.agent_name)

    getSessionInfoByIdentifier(req.params.session_id, (info) => {
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





// Check to see if a session is offline, maybe send an email?
setInterval(() => {
    let current_time = Math.round(+new Date()/1000);
    db.serialize(() => {
        db.each('SELECT * FROM sessions WHERE status=1 AND offline_time < ' + current_time, function (err, row) {
            // console.log(row.identifier + " is now offline.");
        })
    })
}, 1000);
