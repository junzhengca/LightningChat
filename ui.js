// LightningChat.devMode = false; // !!@!!UNCOMMENTONCOMPILE
LightningChat.devMode = true; // !!@!!DELETEONCOMPILE
LightningChat.apiBase = "http://localhost:3000";
$("body").append('<link href="https://ssl.jackzh.com/file/css/font-awesome-4.4.0/css/font-awesome.min.css" rel="stylesheet" type="text/css" />');

// Load UI HTML
LightningChat.ajax.get("ui.html", {}, function(data){
    $("body").append(data);
    lightningChatInitialize();
})

// Load UI style
if(LightningChat.devMode){
    // In dev mode, load less script
    lightningChatLoadLESS("style.less");
    lightningChatLoadJS("https://ssl.jackzh.com/file/js/less-js/less.min.js");
} else {
    // Otherwise, load css
    lightningChatLoadCSS("style.css");
}

function lightningChatInitialize(){
    LightningChat.init(function(){
        reloadSessionEmail();
    });
    function reloadSessionEmail(){
        LightningChat.loadSessionEmail(function(email){
            if(!email){
                $("#lightning-chat-email-form").slideDown();
                $("#lightning-chat-email-status").slideUp();
            } else {
                $("#lightning-chat-email-form").slideUp();
                $("#lightning-chat-email-status label").html("Hi! " + email);
                $("#lightning-chat-email-status").slideDown();
            }
        });
    }

    $("#new-chat-controls").click(function(){
        LightningChat.setCookie("lcskey", "", -1);
        LightningChat.init(function(){
            reloadSessionEmail();
        });
    })
    $("#lightning-chat-email-box").blur(function(){
        if(LightningChat.validateEmail($(this).val())){
            // alert("year!");
            $(this).removeClass("error");
            $(this).attr("disabled", true);
            LightningChat.setSessionEmail($(this).val(), function(result){
                if(result){
                    $("#lightning-chat-email-box").val("");
                    reloadSessionEmail();
                } else {
                    $(this).attr("disabled", false);
                    $(this).addClass("error");
                }
            })
        } else {
            $(this).addClass("error");
        }
    })

    LightningChat.onMessageLoaded = function(messages){
        $("#bubble-container").html("");
        for(i in messages){
            if(messages[i].sender == "visitor"){
                var bubble_class = "right-bubble";
            } else {
                var bubble_class = "left-bubble";
            }
            $("#bubble-container").append("<div class='" + bubble_class + "'><p>" + messages[i].message + "</p></div>");
        }
        $('#bubble-container').scrollTop($('#bubble-container')[0].scrollHeight);

    }
    LightningChat.onNewMessage = function(message){
        // console.log("new message " + message.message);
        if(message.sender == "visitor"){
            var bubble_class = "right-bubble";
        } else {
            var bubble_class = "left-bubble";
        }
        $("#bubble-container").append("<div class='" + bubble_class + "'><p>" + message.message + "</p></div>");
        $('#bubble-container').scrollTop($('#bubble-container')[0].scrollHeight);
    }
    LightningChat.onStatusChange = function(stat) {
        if(stat == 0){
            $("#lightning-chat-container").addClass("closed");
        } else {
            $("#lightning-chat-container").removeClass("closed");
        }
    }
    $('#lighting-message-area').keyup(function(e){
        if(e.keyCode == 13)
        {
            if($("#lighting-message-area").val() != ""){
                var message = $("#lighting-message-area").val();
                $("#lighting-message-area").val("");
                LightningChat.sendMessage(message, function(result){
                    if(!result){
                        alert("failed to send message");
                    }
                });
            }
        }
    });

    $("#begin-chat-button").click(function(){
        $("#content-container").toggleClass("not-shown");
        $(this).toggleClass("active");
    });
}
