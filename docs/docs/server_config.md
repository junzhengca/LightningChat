# Server Configuration

All server configuration are done by modifying `settings.js`.

Here is the default content:

```js
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
}
```


### mailgun_api_key (required)

Your MailGun API key, should be in the format of `key-xxxxxxxxxxxxxxxxxxxxxxxxxxxx`.

### mail_domain (required)

The domain you wish to send email with, must be registered with MailGun.

### slack_bot_key (required)

Slack bot API key.

### app_port (required)

The port you wish to run on. Default `3000`.

### agents[] (required)

Registered agents. Each agent has two properties, `name` and `id`, leave the `id` field `false`.

### channel (required)

The channel bot will post on if no assigned agent is found.

### online_notification (optional)

`true` if you wish all agents to recieve a notification when the bot goes online. Default `false`.