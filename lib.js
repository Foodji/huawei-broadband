const CurlRequest = require("curl-request");
const Xml2JS = require("xml2js");
const NodeHtmlParser = require("node-html-parser");


module.exports = function (options) {

    const routerIp = options.routerIp;
    const routerProxy = options.proxy;
    var defaultCredentials = undefined;

    function typefy(data) {
        switch (typeof (data)) {
            case "object":
                if (Array.isArray(data)) {
                    return data.map(typefy);
                } else {
                    for (var key in data)
                        data[key] = typefy(data[key]);
                    return data;
                }
            case "string":
                if (data === "true")
                    return true;
                if (data === "false")
                    return false;
                if (parseInt(data, 10) + "" === data)
                    return parseInt(data, 10);
                return data;
            default:
                return data;
        }
    }

    function parseXml(xmlStr) {
        return new Promise(function (resolve, reject) {
            Xml2JS.parseString(xmlStr, {explicitArray: false}, function (err, result) {
                if (err)
                    reject(err);
                else
                    resolve(typefy(result));
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
                            try {
                                for (var key in result.body) {
                                    var v = parseInt(result.body[key], 10);
                                    if (v + "" === result.body[key])
                                        result.body[key] = v;
                                }
                            } catch (e) {
                            }
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
                var creds = {
                    sessionId: false,
                    csrfTokens: [result.body.token]
                };
                defaultCredentials = creds;
                return creds;
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
                defaultCredentials = result;
                return result;
            }
            throw "Unsupported";
        });
    }

    function deviceControlReboot(credentials) {
        return curlRequest({
            method: "post",
            path: "/api/device/control",
            credentials: credentials || defaultCredentials,
            body: {request: {Control: 1}},
            requestType: "xml",
            responseType: "xml"
        });
    }

    function deviceMonitoringStatus(credentials) {
        return curlRequest({
            method: "get",
            path: "/api/monitoring/status",
            credentials: credentials || defaultCredentials,
            responseType: "xml"
        });
    }

    function deviceMonitoringTrafficStatistics(credentials) {
        return curlRequest({
            method: "get",
            path: "/api/monitoring/traffic-statistics",
            credentials: credentials || defaultCredentials,
            responseType: "xml"
        });
    }

    function deviceNetCurrentPlmn(credentials) {
        return curlRequest({
            method: "get",
            path: "/api/net/current-plmn",
            credentials: credentials || defaultCredentials,
            responseType: "xml"
        });
    }

    function deviceNetPlmnList(credentials) {
        return curlRequest({
            method: "get",
            path: "/api/net/plmn-list",
            credentials: credentials || defaultCredentials,
            responseType: "xml"
        }).then(function (result) {
            result.body = result.body.Networks.Network;
            return result;
        });
    }

    return {
        getWebserverToken: getWebserverToken,
        getWebserverSessionIdAndCSRFTokens: getWebserverSessionIdAndCSRFTokens,
        deviceControlReboot: deviceControlReboot,
        deviceMonitoringStatus: deviceMonitoringStatus,
        deviceMonitoringTrafficStatistics: deviceMonitoringTrafficStatistics,
        deviceNetCurrentPlmn: deviceNetCurrentPlmn,
        deviceNetPlmnList: deviceNetPlmnList
    };
};