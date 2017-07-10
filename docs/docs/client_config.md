# Client Configuration

Client configuration is coded to your HTML page, right before `<script src="<path to lc.min.js>"></script>`.

The default configuration looks like this:

```js
lightningChatApiBase = "<your api access point>"
lightningChatInterfaceResources = {
  htmlPath:"<path to ui.html>",
  welcomeMessage: "Welcome to AMACSS at UTSC, how can we help?",
  emailMessage: "What is you email address? if you are away, you will recieve an email notification when we reply."
}
lightningChatInitialQuiz = []
```

### lightningChatApiBase

Your API access point, default should be `your-domain:3000`.

### lightningChatInterfaceResources.htmlPath

Path to `/client/compiled/ui.html`.

### lightningChatInterfaceResources.welcomeMessage

Initial welcome message to be displayed to the visitor.

### lightningChatInterfaceResources.emailMessage

Initial message to ask for email address.

### lightningChatInitialQuiz[]

Contains a series of question object. **API IS VARY LIKELY TO CHANGE!!!!!**

* `question` - The question to ask
* `choice` - Array of choices
* `consequence` - Array of consequences, for example `assign user,to 2`.
* `time` - If `choice` is `null`, question will dismiss after this time.