const CurlRequest = require("curl-request");
const Xml2JS = require("xml2js");
const NodeHtmlParser = require("node-html-parser");

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

function buildXml(xml) {
    const builder = new Xml2JS.Builder({
        renderOpts: {pretty: false}
    });
    return builder.buildObject(xml);
}

function parseHtml(htmlStr) {
    return NodeHtmlParser.parse(htmlStr);
}


const routerIp = "192.168.0.1";
const routerProxy = "127.0.0.1:8081";

function curlRequest(options) {
    const curl = new (CurlRequest)();
    if (routerProxy)
        curl.setProxy(routerProxy);
    if (options.credentials) {
        options.headers = options.headers || {};
        options.headers.__RequestVerificationToken = options.credentials.csrfTokens[0];
        if (options.credentials.sessionId)
            options.headers.Cookie = "SessionID=" + options.credentials.sessionId;
    }
    if (options.headers) {
        var headers = [];
        for (var key in options.headers)
            headers.push(key + ": " + options.headers[key]);
        curl.setHeaders(headers);
    }
    if (options.body) {
        if (options.requestType) {
            switch (options.requestType) {
                case "xml":
                    options.body = buildXml(options.body);
                    break;
                default:
            }
        }
        curl.setBody(options.body);
    }
    const request = curl[options.method]("http://" + routerIp + options.path);
    if (options.responseType) {
        switch (options.responseType) {
            case "xml":
                return request.then(function (result) {
                    return parseXml(result.body).then(function (xmlResult) {
                        result.body = xmlResult.response;
                        return result;
                    });
                });
            case "html":
                return request.then(function (result) {
                    result.body = parseHtml(result.body);
                    return result;
                });
            default:
                throw "Unsupported";
        }
    } else
        return request;
}

function getWebserverToken() {
    return curlRequest({
        method: "get",
        path: "/api/webserver/token",
        responseType: "xml"
    }).then(function (result) {
        if (result.body && result.body.token) {
            return {
                sessionId: false,
                csrfTokens: [result.body.token]
            }
        }
        throw "Unsupported";
    });
}

function getWebserverSessionIdAndCSRFTokens() {
    var result = {
        sessionId: false,
        csrfTokens: []
    };
    return curlRequest({
        method: "get",
        path: "/html/home.html",
        responseType: "html"
    }).then(function (curlResult) {
        curlResult.body.querySelectorAll("meta").forEach(function (htmlElement) {
            if (htmlElement.attributes.name === "csrf_token")
                result.csrfTokens.push(htmlElement.attributes.content);
        });
        if (curlResult.headers) {
            for (var key in curlResult.headers) {
                var match = /Set-Cookie:SessionID=([^;]+)/g.exec(key);
                if (match)
                    result.sessionId = match[1];
            }
            return result;
        }
        throw "Unsupported";
    });
}

function deviceControlReboot(credentials) {
    return curlRequest({
        method: "post",
        path: "/api/device/control",
        credentials: credentials,
        body: {request: {Control: 1}},
        requestType: "xml",
        responseType: "xml"
    });
}

getWebserverSessionIdAndCSRFTokens().then(function (credentials) {
    console.log(credentials);
    deviceControlReboot(credentials).then(function (result) {
        console.log(result);
    }).catch(function (err) {
        console.log(err);
    });
}).catch(function (err) {
    console.log(err);
});
