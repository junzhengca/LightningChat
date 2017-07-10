# Setup

## Development Environment

### Required Software

* A text editor
* A computer with macOS, Windows or Linux
* Python 3
* Node.js (v6.11.0+) w/ NPM
* SQLite 3

### Required Services

* Slack with bot API key
* MailGun API key

### Running Development Server

First, copy `settings.template.js` to `settings.js` and add your API keys. **DO NOT CHANGE `settings.template.js`.** More info about `settings.js` can be found [here](/server_config).

Then copy `messages.template.db` to `messages.db`.

Run `npm install` and `node index.js`.

You are good to go. Default app location is `http://localhost:3000/`.

### Compiling Client

There is a script called `compile.py` in `client` folder. Simply run `python3 compile.py` in the folder to compile.

Compiled code are stored in `client/compiled` folder.

## Production Environment

### Server

First, copy `settings.template.js` to `settings.js` and add your API keys. More info about `settings.js` can be found [here](/server_config).

Then copy `messages.template.db` to `messages.db`.

Run `npm install` and `node index.js`.

You are good to go. Default app location is `http://localhost:3000/`.

### Client

Simply paste the following code into your webpage. More about client configuration can be found [here](/client_config).

```html
<script type="text/javascript">
    lightningChatApiBase = "<your api access point>"
    lightningChatInterfaceResources = {
        htmlPath:"<path to ui.html>",
        welcomeMessage: "Welcome to AMACSS at UTSC, how can we help?",
        emailMessage: "What is you email address? if you are away, you will recieve an email notification when we reply."
    }
    lightningChatInitialQuiz = []
</script>
<script src="<path to lc.min.js>"></script>
```