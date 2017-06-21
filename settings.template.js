module.exports = {
    mailgun_api_key: "key-xxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    mail_domain: "mail.example.com",
    slack_bot_key: "xoxb-xxxxxxxxxxxxxxxx-xxxxxxxxxxxxxxx",
    app_port: 3000,
    agents:[
        {
            name:"slack username",
            id:false // Keep this false, will autoload upon start
        }
    ],
    // Which channel will unassigned chat be posted
    channel:{
        name:"your channel name",
        id:false // Keep this false
    },
    online_notification: false
};