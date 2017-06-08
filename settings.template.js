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
    ]
};