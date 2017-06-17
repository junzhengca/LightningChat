function lightningChatLoadJS(url){
    var el = document.createElement('script');
    el.async = false;
    el.src = url;
    el.type = 'text/javascript';

    (document.getElementsByTagName('HEAD')[0]||document.body).appendChild(el);
}

function lightningChatLoadLESS(url){
    var el = document.createElement('link');
    el.async = false;
    el.href = url;
    el.type = 'text/less';
    el.rel = 'stylesheet';

    (document.getElementsByTagName('HEAD')[0]||document.body).appendChild(el);
}

function lightningChatLoadCSS(url){
    var el = document.createElement('link');
    el.async = false;
    el.href = url;
    el.type = 'text/css';
    el.rel = 'stylesheet';

    (document.getElementsByTagName('HEAD')[0]||document.body).appendChild(el);
}