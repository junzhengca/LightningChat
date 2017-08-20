// Load Express
const express = require('express')
var body_parser = require('body-parser')
const app = express()
var cors = require('cors')
app.use(body_parser.json())
// Fix CORS
app.use(cors())
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

var util = require('./util')(db, settings, mailgun)
console.log(util)

initialize()
require('./middlewares/cors')(app)
require('./listeners/list')(controller, util, bot_utility, db)
require('./listeners/help')(controller, util, bot_utility, db)
require('./listeners/message')(controller, util, bot_utility, db)
require('./listeners/agent')(controller, util, bot_utility, db)
require('./listeners/session')(controller, util, bot_utility, db)
require('./listeners/archive')(controller, util, bot_utility, db)

require('./routes/sessions')(app, util, db, bot)
require('./routes/email')(app, util, db, bot)
var bot

function initialize(){
    // Function to start the RTM server.
    function startRtm(callback) {
        bot.startRTM(function(err,bot,payload) {
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
    })

    bot = controller.spawn({
        token: settings.slack_bot_key
    })

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
