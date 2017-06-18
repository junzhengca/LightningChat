// LightningChat.devMode = false; // !!@!!UNCOMMENTONCOMPILE
LightningChat.devMode = true; // !!@!!DELETEONCOMPILE

// Load fontawesome
document.body.innerHTML += '<link href="https://ssl.jackzh.com/file/css/font-awesome-4.4.0/css/font-awesome.min.css" rel="stylesheet" type="text/css" />';

// Load UI HTML
LightningChat.ajax.get(LightningChat.interfaceResources.htmlPath, {}, function(data){
    document.body.innerHTML += data;
    // Replace text with all custom config variables
    LightningChat.dom.lightningId("lightning-chat-welcome-message").setContent(LightningChat.interfaceResources.welcomeMessage);
    LightningChat.dom.lightningId("lightning-chat-email-message").setContent(LightningChat.interfaceResources.emailMessage);
    lightningChatInitialize();
})

// Load UI style
if(LightningChat.devMode){
    // In dev mode, load less script
    lightningChatLoadLESS("style.less");
    lightningChatLoadJS("https://ssl.jackzh.com/file/js/less-js/less.min.js");
} else {
    // Otherwise, load css
    lightningChatLoadCSS(lightningChatInterfaceResources.cssPath);
}

function lightningChatInitialize(){
    LightningChat.init(function(){
        reloadSessionEmail();
    });

    // Reload session email status
    function reloadSessionEmail(){
        LightningChat.loadSessionEmail(function(email){
            if(!email){
                LightningChat.dom.removeClass(LightningChat.dom.id("lightning-chat-email-form"), "lightning-chat-hidden");
                LightningChat.dom.addClass(LightningChat.dom.id("lightning-chat-email-status"), "lightning-chat-hidden");
            } else {
                LightningChat.dom.addClass(LightningChat.dom.id("lightning-chat-email-form"), "lightning-chat-hidden");
                LightningChat.dom.removeClass(LightningChat.dom.id("lightning-chat-email-status"), "lightning-chat-hidden");
                LightningChat.dom.id("lightning-chat-email-status-label").innerHTML = "Hi! " + email;
            }
        });
    }

    LightningChat.dom.id("new-chat-controls").onclick = function(){
        LightningChat.setCookie("lcskey", "", -1);
        LightningChat.init(function(){
            reloadSessionEmail();
        });
    };


    LightningChat.dom.id("lightning-chat-email-box").onblur = function(){
        if(LightningChat.validateEmail(LightningChat.dom.id("lightning-chat-email-box").value)){
            LightningChat.dom.removeClass(LightningChat.dom.id("lightning-chat-email-box"), "error");
            LightningChat.dom.id("lightning-chat-email-box").disabled = true;
            LightningChat.setSessionEmail(LightningChat.dom.id("lightning-chat-email-box").value, function(result){
                if(result){
                    LightningChat.dom.id("lightning-chat-email-box").value = "";
                    reloadSessionEmail();
                } else {
                    LightningChat.dom.id("lightning-chat-email-box").disabled = false;
                    LightningChat.dom.addClass(LightningChat.dom.id("lightning-chat-email-box"), "error");
                }
            })
        } else {
            LightningChat.dom.addClass(LightningChat.dom.id("lightning-chat-email-box"), "error");
        }
    };

    LightningChat.onMessageLoaded = function(messages){
        LightningChat.dom.id("bubble-container").innerHTML = "";
        for(i in messages){
            if(messages[i].sender == "visitor"){
                var bubble_class = "right-bubble";
            } else {
                var bubble_class = "left-bubble";
            }
            LightningChat.dom.id("bubble-container").innerHTML += "<div class='" + bubble_class + "'><p>" + messages[i].message + "</p></div>";
        }

        LightningChat.dom.id("bubble-container").scrollTo(0, LightningChat.dom.id("bubble-container").scrollHeight);

    }


    LightningChat.onNewMessage = function(message){
        // console.log("new message " + message.message);
        if(message.sender == "visitor"){
            var bubble_class = "right-bubble";
        } else {
            var bubble_class = "left-bubble";
        }
        LightningChat.dom.id("bubble-container").innerHTML += "<div class='" + bubble_class + "'><p>" + message.message + "</p></div>";
        LightningChat.dom.id("bubble-container").scrollTo(0, LightningChat.dom.id("bubble-container").scrollHeight);
    }

    LightningChat.onStatusChange = function(stat) {
        if(stat == 0){
            LightningChat.dom.addClass(LightningChat.dom.id("lightning-chat-container"), "closed");
        } else {
            LightningChat.dom.removeClass(LightningChat.dom.id("lightning-chat-container"), "closed");
        }
    }

    LightningChat.onInitialQuizShouldStart = function(quiz){
        LightningChat.dom.addClass(LightningChat.dom.id("bubble-container"), "lightning-chat-hidden");
        LightningChat.dom.addClass(LightningChat.dom.id("lightning-chat-controls"), "lightning-chat-hidden");
        LightningChat.dom.removeClass(LightningChat.dom.id("lightning-chat-initial-quiz-container"), "lightning-chat-hidden");

    }

    LightningChat.onInitialQuizQuestionShouldChange = function(question){
        console.log(question);
        if(question.choice){
            LightningChat.dom.id("lightning-chat-initial-quiz-message").innerHTML = question.question;
            LightningChat.dom.id("lightning-chat-initial-quiz-choices").innerHTML = "";
            for(i in question.choice){
                LightningChat.dom.id("lightning-chat-initial-quiz-choices").innerHTML += "<li onclick='LightningChat.runInitialQuizAction(" + i + ")'>" + question.choice[i] + "</li>";
            }
        } else {
            LightningChat.dom.id("lightning-chat-initial-quiz-message").innerHTML = question.message;
            LightningChat.dom.id("lightning-chat-initial-quiz-choices").innerHTML = "";
        }
    }

    LightningChat.onInitialQuizShouldEnd = function(quiz){
        LightningChat.dom.removeClass(LightningChat.dom.id("bubble-container"), "lightning-chat-hidden");
        LightningChat.dom.removeClass(LightningChat.dom.id("lightning-chat-controls"), "lightning-chat-hidden");
        LightningChat.dom.addClass(LightningChat.dom.id("lightning-chat-initial-quiz-container"), "lightning-chat-hidden");
    }

    
    
    LightningChat.dom.id("lighting-message-area").onkeyup = function(e){
        if(e.keyCode == 13)
        {
            if(LightningChat.dom.id("lighting-message-area").value != ""){
                var message = LightningChat.dom.id("lighting-message-area").value;
                LightningChat.dom.id("lighting-message-area").value = "";
                LightningChat.sendMessage(message, function(result){
                    if(!result){
                        alert("failed to send message");
                    }
                });
            }
        }
    };

    LightningChat.dom.id("lightning-chat-begin-chat-button").onclick = function(){
        LightningChat.dom.toggleClass(LightningChat.dom.id("lightning-chat-content-container"), "not-shown");
        LightningChat.dom.toggleClass(LightningChat.dom.id("lightning-chat-begin-chat-button"), "active");
    }
}
