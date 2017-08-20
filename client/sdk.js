/*
 (c) Jun Zheng 2017
*/

var LightningChat = {
    devMode: false,
    sessionKey: false,
    apiBase: "",
    interfaceResources: {},
    messages: [],
    status:null,
    initialQuiz:null,
    currentQuizQuestion:0,
    isOnline:true,
    init: function(callback){
        LightningChat.sessionKey = LightningChat.getCookie("lcskey");
        LightningChat.getSession(this.sessionKey, function(result){
            if(!result){
                LightningChat.newSession(function(result){
                    // Initialize again
                    LightningChat.init(callback);
                })
            } else {
                console.log("LightningChat initialized, session key -> " + LightningChat.sessionKey);
                LightningChat.messages = result;
                console.log(result);
                LightningChat.onMessageLoaded(result);
                // No messages, we should do the initial quiz.
                if(result.length == 0){
                    LightningChat.currentQuizQuestion = 0;
                    LightningChat.onInitialQuizShouldStart(LightningChat.initialQuiz);
                    LightningChat.onInitialQuizQuestionShouldChange(LightningChat.initialQuiz[LightningChat.currentQuizQuestion]);
                }
                LightningChat.beginHeartBeat();
                LightningChat.beginCheckInterval();
                callback();
            }
        })
    },
    // Event bindings
    onMessageLoaded: function(messages){},
    onNewMessage: function(new_message){},
    onStatusChange: function(stat){},
    onInitialQuizShouldStart: function(quiz){},
    onInitialQuizQuestionShouldChange: function(question){},
    onInitialQuizShouldEnd: function(){},
    onHeartBeat: function(){},
    runInitialQuizAction: function(choice_id, cmd){
        // Only proceed if choic_id is valid
        var consequence;
        if(cmd){
          consequence = cmd;
        } else {
          if(LightningChat.initialQuiz[LightningChat.currentQuizQuestion].choice.length - 1 < choice_id || choice_id < 0){
            return false;
          } else {
            consequence = LightningChat.initialQuiz[LightningChat.currentQuizQuestion].consequence[choice_id];
          }
        }
        consequence = consequence.split(",");
        for(i in consequence){
            cmd = consequence[i].split(" ");
            if(cmd[0] == "to"){
                questionId = parseInt(cmd[1]);
                LightningChat.currentQuizQuestion = questionId;
                LightningChat.onInitialQuizQuestionShouldChange(LightningChat.initialQuiz[questionId]);
                // This is a message block
                if(LightningChat.initialQuiz[questionId].type === "exit-message"){
                    setTimeout(function(){
                        LightningChat.onInitialQuizShouldEnd();
                    }, LightningChat.initialQuiz[questionId].time);
                }
            } else if (cmd[0] == "end") {
                LightningChat.onInitialQuizShouldEnd();
            } else if (cmd[0] == "assign") {
                LightningChat.ajax.post(LightningChat.apiBase + "/sessions/" + LightningChat.sessionKey + "/assigned_agent/" + cmd[1], {} , function(data){
                    try {
                        data = JSON.parse(data);
                    } catch (e) {
                        // Failed to parse response
                        console.log("Failed to parse response (runInitialQuizAction)");
                        return;
                    }
                });
            }
        }
    },
    beginCheckInterval: function(){
        setInterval(function(){
            LightningChat.ajax.get(LightningChat.apiBase + "/sessions/" + LightningChat.sessionKey, {}, function(data){
                try {
                    data = JSON.parse(data);
                } catch (e) {
                    // Failed to parse response
                    console.log("Failed to parse response (checkInterval)");
                    return;
                }
                if(data.status && data.status == "notfound"){
                    // Session key not found
                    console.log("Session key not found (checkInterval)");
                } else {
                    for (i = data.length - (data.length - LightningChat.messages.length); i < data.length; i++){
                        LightningChat.onNewMessage(data[i]);
                    }
                    LightningChat.messages = data;
                }
            })
            LightningChat.ajax.get(LightningChat.apiBase + "/sessions/" + LightningChat.sessionKey + "/info", {}, function(data){
                try {
                    data = JSON.parse(data);
                } catch (e) {
                    // Failed to parse response
                    console.log("Failed to parse response (checkInterval-info)");
                    return;
                }
                if(data.status && data.status == "notfound"){
                    // Session key not found
                    console.log("Session key not found (checkInterval-info)");
                } else {
                    if(LightningChat.status != data.status){
                        LightningChat.onStatusChange(data.status);
                    }
                    LightningChat.status = data.status;
                }
            })
        }, 2000);
    },
    loadSessionEmail: function(callback){
        LightningChat.ajax.get(LightningChat.apiBase + "/sessions/" + LightningChat.sessionKey + "/info", {}, function(data){
            try {
                data = JSON.parse(data);
            } catch (e) {
                // Failed to parse response
                callback(false); return;
            }
            if(data.status && data.status == "notfound"){
                // Session key not found
                callback(false);
            } else {
                // Session key found
                if(data.email == "none"){
                    callback(false);
                } else {
                    console.log(data);
                    callback(data.email);
                }
            }
        })
    },
    setSessionEmail: function(email, callback){
        LightningChat.ajax.post(LightningChat.apiBase + "/sessions/" + LightningChat.sessionKey + "/email", {email: email}, function(data){
            try {
                data = JSON.parse(data);
            } catch (e) {
                // Failed to parse response
                callback(false); return;
            }
            if(data.status && data.status != "ok"){
                callback(false);
            } else {
                callback(true);
            }
        })
    },
    validateEmail: function(email) {
        var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return re.test(email);
    },
    sendMessage: function(message, callback){
      // We directly add the message to list
      LightningChat.messages.push({
        id:-1,
        identifier: null,
        message: message,
        sender: "visitor"
      });
      LightningChat.onNewMessage({
        id:-1,
        identifier: null,
        message: message,
        sender: "visitor"
      });
        LightningChat.ajax.post(LightningChat.apiBase + "/sessions/" + LightningChat.sessionKey, {message: message}, function(data){
            try {
                data = JSON.parse(data);
            } catch (e) {
                // Failed to parse response
                callback(false); return;
            }
            if(data.status && data.status != "ok"){
                callback(false);
            } else {
                callback(true);
            }
        })
    },
    beginHeartBeat: function(){
        setInterval(function(){
            LightningChat.ajax.get(LightningChat.apiBase + "/sessions/" + LightningChat.sessionKey + "/heartbeat", {}, function(data){
              try {
                  data = JSON.parse(data);
              } catch (e) {
                  // Failed to parse response
                  callback(false); return;
              }
              LightningChat.isOnline = data.online
              LightningChat.onHeartBeat()
              console.log("Heartbeat finished at " + (new Date()));
            })
        }, 2000);
    },
    getCookie: function(cname) {
        var name = cname + "=";
        var decodedCookie = decodeURIComponent(document.cookie);
        var ca = decodedCookie.split(';');
        for(var i = 0; i <ca.length; i++) {
            var c = ca[i];
            while (c.charAt(0) == ' ') {
                c = c.substring(1);
            }
            if (c.indexOf(name) == 0) {
                return c.substring(name.length, c.length);
            }
        }
        return false;
    },
    // Get basic information about a session
    getSession: function(sessionKey, callback) {
        this.ajax.get(this.apiBase + "/sessions/" + sessionKey, {}, function(data){
            try {
                data = JSON.parse(data);
            } catch (e) {
                // Failed to parse response
                callback(false); return;
            }
            if(data.status && data.status == "notfound"){
                // Session key not found
                callback(false);
            } else {
                // Session key found
                callback(data);
            }
        })
    },
    // Create a new session
    newSession: function(callback) {
        LightningChat.ajax.post(LightningChat.apiBase + "/sessions" , {}, function(data){
            try {
                data = JSON.parse(data);
            } catch (e) {
                callback(false); return;
            }
            LightningChat.setCookie("lcskey", data.session_id, 365);
            callback(true);
        })
    },
    setCookie: function(cname, cvalue, exdays) {
        var d = new Date();
        d.setTime(d.getTime() + (exdays*24*60*60*1000));
        var expires = "expires="+ d.toUTCString();
        document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
    },
    // Utility methods about DOM elements
    dom: {
        // Select a DOM element by ID
        id:function(name) {
            return document.getElementById(name);
        },
        // Select by ID and return LightningDomObject
        lightningId:function(name){
            return new LightningChat.LightningDomObject(document.getElementById(name));
        },
        // Select a DOM element by tag
        tag:function(name) {
            return document.getElementsByTagName(name);
        },
        // Remove a class from DOM
        removeClass:function(dom, name) {
            dom.classList.remove(name);
        },
        // Add a class to DOM
        addClass:function(dom, name){
            dom.className += ' ' + name;
        },
        // Toggle a class
        toggleClass:function(dom, name){
            if(LightningChat.dom.hasClass(dom, name)){
                LightningChat.dom.removeClass(dom, name);
            } else {
                LightningChat.dom.addClass(dom, name);
            }
        },
        // Check if has class
        hasClass:function(dom, name) {
            return (' ' + dom.className + ' ').indexOf(' ' + name + ' ') > -1;
        }
    },
    LightningDomObject: function(dom){
        this.dom = dom;
        this.addClass = function(name){
            this.dom.className += ' ' + name;
            if(this.hasClass(name)){
                this.removeClass(name);
            } else {
                this.addClass(name);
            }
            return this;
        }
        this.toggleClass = function(name){
            return this;
        }
        this.hasClass = function(name){
            return (' ' + this.dom.className + ' ').indexOf(' ' + name + ' ') > -1;
        }
        this.removeClass = function(name){
            this.dom.classList.remove(name);
            return this;
        }
        this.setContent = function(content){
            this.dom.innerHTML = content;
            return this;
        }
        this.appendContent = function(content){
            this.dom.innerHTML += content;
        }
    },
    ajax: {
        x:function () {
            if (typeof XMLHttpRequest !== 'undefined') {
                return new XMLHttpRequest();
            }
            var versions = [
                "MSXML2.XmlHttp.6.0",
                "MSXML2.XmlHttp.5.0",
                "MSXML2.XmlHttp.4.0",
                "MSXML2.XmlHttp.3.0",
                "MSXML2.XmlHttp.2.0",
                "Microsoft.XmlHttp"
            ];

            var xhr;
            for (var i = 0; i < versions.length; i++) {
                try {
                    xhr = new ActiveXObject(versions[i]);
                    break;
                } catch (e) {
                }
            }
            return xhr;
        },
        send:function (url, callback, method, data, async) {
            if (async === undefined) {
                async = true;
            }
            var x = LightningChat.ajax.x();
            x.open(method, url, async);
            x.onreadystatechange = function () {
                if (x.readyState == 4) {
                    callback(x.responseText)
                }
            };
            if (method == 'POST') {
                x.setRequestHeader('Content-type', 'application/json');
            }
            x.send(data)
        },
        get:function (url, data, callback, async) {
            var query = [];
            for (var key in data) {
                query.push(encodeURIComponent(key) + '=' + encodeURIComponent(data[key]));
            }
            LightningChat.ajax.send(url + (query.length ? '?' + query.join('&') : ''), callback, 'GET', null, async)
        },
        post:function (url, data, callback, async) {
            LightningChat.ajax.send(url, callback, 'POST', JSON.stringify(data), async)
        }
    }
}
