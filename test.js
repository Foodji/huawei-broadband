const CurlRequest = require("curl-request");
const Xml2JS = require("xml2js");


function parseXml(xmlStr) {
    return new Promise(function(resolve, reject) {
        Xml2JS.parseString(xmlStr, function (err, result) {
            if (err)
                reject(err);
            else
                resolve(result);
        });
    });
}

function curlRequest(method, path) {
    const curl = new (CurlRequest)();
    if (routerProxy)
        curl.setProxy(routerProxy);
    return curl[method]("http://" + routerIp + path);
}

function xmlRequest(method, path) {
    return curlRequest(method, path).then(function (result) {
        return parseXml(result.body);
    });
}


const routerIp = "192.168.8.1";
const routerProxy = "127.0.0.1:8081";


function getWebserverToken() {
    return xmlRequest("get", "/api/webserver/token").then(function (result) {
        if (result.response && result.response.token)
            return result.response.token[0];
        throw "Unsupported";
    });
}

function getWebserverSession() {
    return curlRequest("get", "/html/home.html").then(function (result) {
        if (result.headers) {
            for (var key in result.headers) {
                var match = /set-cookie:sessionid=([^;]+)/g.exec(key);
                if (match)
                    return match[1];
            }
        }
        throw "Unsupported";
    });
}

getWebserverSession().then(function (result) {
    console.log(result);
}).catch(function (err) {
    console.log(err);
});
