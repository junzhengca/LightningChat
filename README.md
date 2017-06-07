# LightningChat

## About
Developed at the University of Toronto Scarborugh, LightningChat is a real-time chat system that supports email fallback on your website.

The goal is to build an open-source alternative to Drift and Intercom with full Slack support.

(c) Jun Zheng (junthehacker) 2017

![](http://i.imgur.com/eqqLyXr.png)
![](http://i.imgur.com/X1KxQoB.png)

**Dependencies**
* MailGun Account
* Slackbot API Key
* Node.js v7.0

### Setup (Server)
* Clone the repo, edit and rename `settings.template.js` to `settings.js`.
* Rename `messages.template.db` to `messages.db`.
* `npm install`
* `npm run`

All agents should get a message like this:
![](https://i.imgur.com/BB0fCED.png)

### Setup (Website)
* Link `sdk.js` on your site.
* You can copy&paste the code in `test.html`, or you can make your own widget. 

### How to use

All interations are done by sending private messages to the bot.

For example, if you type `help`:
![](http://i.imgur.com/9kFs4Th.png)
The little check mark under your message means the bot has recieved you message.


If a visitor sends a message, there **WON'T** be any notifications. You can modify this behavior by modifying the source code.

You can type `list` or `listall` to see all sessions.
![](http://i.imgur.com/29PCZEM.png)

If you wish to recieve all notifications for a session, you must be assigned. Type `assign {session id} {your username}` to assign yourself. Only one person can be assigned for each session.

![](http://i.imgur.com/YKYXCOA.png)

Now, if the visitor sends a message, you will get notification for it.
![](http://i.imgur.com/NWpvhj6.png)

You can reply by typing `reply {session id} {your message}`.
![](http://i.imgur.com/0nbWDCx.png)
The little OK icon under your message indicates your message has been sent.

You can also get a chat history, just type `history {session id}`.
![](http://i.imgur.com/qijWCUd.png)

Once you are done, type `close {session id}` to close a chat session.
![](http://i.imgur.com/R8iCpVe.png)