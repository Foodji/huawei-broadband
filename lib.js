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
        const request = curl[options.method.toLowerCase()]("http://" + routerIp + options.path);
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

    function getUnifiedCredentials() {
        return getWebserverSessionIdAndCSRFTokens().then(function (result) {
            return !result.sessionId && result.csrfTokens.length === 0 ? getWebserverToken() : result;
        });
    }

    function deviceControlReboot(credentials) {
        return curlRequest({
            method: "post",
            path: "/api/device/control",
            credentials: credentials || defaultCredentials,
            body: {request: {
                Control: 1
            }},
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

    const NETWORK_STATE_STRINGS = {
        1: "AVAILABLE",
        2: "REGISTERED",
        3: "FORBIDDEN"
    };

    const NETWORK_RAT_STRINGS = {
        0: "2G",
        2: "3G",
        5: "H",
        7: "4G"
    };

    function deviceNetPlmnList(credentials) {
        return curlRequest({
            method: "get",
            path: "/api/net/plmn-list",
            credentials: credentials || defaultCredentials,
            responseType: "xml"
        }).then(function (result) {
            result.body = result.body.Networks.Network.map(function (network) {
                network.StateString = NETWORK_STATE_STRINGS[network.State] || "UNKNOWN";
                network.RatString = NETWORK_RAT_STRINGS[network.Rat] || "UNKNOWN";
                return network;
            });
            return result;
        });
    }

    function deviceNetRegister(credentials, plmn, rat) {
        return curlRequest({
            method: "post",
            path: "/api/net/register",
            credentials: credentials || defaultCredentials,
            body: {request: {
                Mode: plmn || rat ? 1 : 0,
                Plmn: plmn || "",
                Rat: rat || ""
            }},
            requestType: "xml",
            responseType: "xml"
        });
    }

    const NETWORK_MODES = {
        "AUTO": "00",
        "03": "4G",
        "0201": "3G/2G",
        "02": "3G",
        "01": "2G"
    };

    function deviceNetMode(credentials, networkMode, networkBand, lteBand) {
        return curlRequest({
            method: "post",
            path: "/api/net/net-mode",
            credentials: credentials || defaultCredentials,
            body: {request: {
                NetworkMode: networkMode || "00",
                NetworkBand: networkBand || "3FFFFFFF",
                LTEBand: lteBand || "7FFFFFFFFFFFFFFF"
            }},
            requestType: "xml",
            responseType: "xml"
        });
    }

    function listedNetworksFilterAvailable(networks) {
        return networks.filter(function (network) {
            return network.State === 1;
        });
    }

    async function analyzeAllNetworks() {
        const networks = await deviceNetPlmnList(await getUnifiedCredentials());
        networks.body = listedNetworksFilterAvailable(networks.body);
        for (var i = 0; i < networks.body.length; ++i) {
            await deviceNetRegister(await getUnifiedCredentials(), networks.body[i].Numeric, networks.body[i].Rat);
            networks.body[i].status = (await deviceMonitoringStatus(await getUnifiedCredentials())).body;
            networks.body[i].current = (await deviceNetCurrentPlmn(await getUnifiedCredentials())).body;
        }
        await deviceNetRegister(await getUnifiedCredentials());
        return networks;
    }

    function analyzedNetworksFilterOnline(networks) {
        return networks.filter(function (network) {
            return !!network.current;
        });
    }

    function analyzedNetworksSortByQuality(networks) {
        return networks.sort(function (b, a) {
            return [
                a.status.SignalIcon - b.status.SignalIcon,
                a.status.CurrentNetworkType - b.status.CurrentNetworkType
            ].find(function (delta) { return delta !== 0 }) || 0;
        });
    }

    async function connectToBestNetwork() {
        const networks = analyzedNetworksSortByQuality(analyzedNetworksFilterOnline((await analyzeAllNetworks()).body));
        return deviceNetRegister(await getUnifiedCredentials(), networks[0].Numeric, networks[0].Rat);
    }

    function deviceGetDialupConnection(credentials) {
        return curlRequest({
            method: "get",
            path: "/api/dialup/connection",
            credentials: credentials || defaultCredentials,
            responseType: "xml"
        });
    }

    function deviceSetDialupConnection(credentials, dataRoaming, autoDisconnect) {
        return curlRequest({
            method: "post",
            path: "/api/dialup/connection",
            credentials: credentials || defaultCredentials,
            body: {request: {
                RoamAutoConnectEnable: dataRoaming ? 1 : 0,
                MaxIdelTime: autoDisconnect ? 7200 : 0,
                ConnectMode: 0,
                MTU: 1500,
                auto_dial_switch: 1,
                pdp_always_on: 0,
                max_idle_switch: autoDisconnect ? 1 : 0
            }},
            requestType: "xml",
            responseType: "xml"
        });
    }

    function deviceGetDialupProfiles(credentials) {
        return curlRequest({
            method: "get",
            path: "/api/dialup/profiles",
            credentials: credentials || defaultCredentials,
            responseType: "xml"
        });
    }

    function deviceCreateDialupProfile(credentials, makeDefault, profileName, apnName, userName, password) {
        return curlRequest({
            method: "post",
            path: "/api/dialup/profiles",
            credentials: credentials || defaultCredentials,
            body: {request: {
                'Delete' : 0,
                'SetDefault' : makeDefault ? 0 : 1, // yes, no typo
                'Modify' : 1,
                'Profile' : {
                    'Index' : '',  //original is new_index
                    'IsValid' : 1,
                    'Name' : profileName,
                    'ApnIsStatic' : apnName ? 1 : 0,
                    'ApnName' : apnName || '',
                    'DialupNum' : '',
                    'Username' : userName || '',
                    'Password' : password || '',
                    'AuthMode' : '0',
                    'IpIsStatic' : '',
                    'IpAddress' : '',
                    'DnsIsStatic' : '',
                    'PrimaryDns' : '',
                    'SecondaryDns' : '',
                    'ReadOnly' : '0',
                    'iptype' : 0
                }
            }},
            requestType: "xml",
            responseType: "xml"
        });
    }

    function deviceSetDefaultDialupProfile(credentials, profileIndex) {
        return curlRequest({
            method: "post",
            path: "/api/dialup/profiles",
            credentials: credentials || defaultCredentials,
            body: {request: {
                'Delete' : 0,
                'SetDefault' : profileIndex,
                'Modify' : 0
            }},
            requestType: "xml",
            responseType: "xml"
        });
    }

    async function upsertDialupProfile(credentials, makeDefault, profileName, apnName, userName, password) {
        const profiles = await deviceGetDialupProfiles(credentials);
        const currentProfile = profiles.body.CurrentProfile;
        const matchingIndexes = [];
        profiles.body.Profiles.Profile.forEach(function (profile, idx) {
            if (profileName && profile.Name !== profileName)
                return;
            if (apnName && profile.ApnName !== apnName)
                return;
            if (userName && profile.Username !== userName)
                return;
            if (password && profile.Password !== password)
                return;
            matchingIndexes.push(idx + 1);
        });
        if (matchingIndexes.length === 0)
            return deviceCreateDialupProfile(credentials, makeDefault, profileName, apnName, userName, password);
        else if (makeDefault && matchingIndexes.indexOf(currentProfile) < 0)
            return deviceSetDefaultDialupProfile(credentials, matchingIndexes[0]);
        else
            return profiles;
    }

    return {
        getWebserverToken: getWebserverToken,
        getWebserverSessionIdAndCSRFTokens: getWebserverSessionIdAndCSRFTokens,
        getUnifiedCredentials: getUnifiedCredentials,
        deviceControlReboot: deviceControlReboot,
        deviceMonitoringStatus: deviceMonitoringStatus,
        deviceMonitoringTrafficStatistics: deviceMonitoringTrafficStatistics,
        deviceNetCurrentPlmn: deviceNetCurrentPlmn,
        deviceNetPlmnList: deviceNetPlmnList,
        deviceNetRegister: deviceNetRegister,
        deviceNetMode: deviceNetMode,
        analyzeAllNetworks: analyzeAllNetworks,
        connectToBestNetwork: connectToBestNetwork,
        deviceGetDialupConnection: deviceGetDialupConnection,
        deviceSetDialupConnection: deviceSetDialupConnection,
        deviceGetDialupProfiles: deviceGetDialupProfiles,
        deviceCreateDialupProfile: deviceCreateDialupProfile,
        deviceSetDefaultDialupProfile: deviceSetDefaultDialupProfile,
        upsertDialupProfile: upsertDialupProfile
    };
};