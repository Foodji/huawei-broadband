const GetOpt = require('node-getopt');
const Util = require('util');

const opt = GetOpt.create([
    ["", "routerip=ROUTERIP", "router ip"],
    ["", "proxy=PROXY", "proxy"],
    ["", "cmd-monitoring-status", "monitoring status"],
    ["", "cmd-monitoring-traffic-statistics", "monitoring traffic statistics"],
    ["", "cmd-net-current-plmn", "net current plmn"],
    ["", "cmd-net-plmn-list", "net plmn list"],
    ["", "cmd-control-reboot", "control reboot"],
    ["", "cmd-net-register", "net register"],
    ["", "cmd-net-mode-automatic", "net mode automatic"],
    ["", "cmd-analyze-all-networks", "analyze all networks"],
    ["", "cmd-connect-to-best-network", "connect to best network"],
    ["", "arg-rat=RAT", "net rat"],
    ["", "arg-plmn=PLMN", "net plmn"],
]).bindHelp().parseSystem().options;

const Lib = require("./lib.js");

const router = Lib({
    routerIp: opt.routerip,
    proxy: opt.proxy
});


(async function () {

    var credentials = await router.getUnifiedCredentials();
    console.log("Credentials", credentials);

    if (opt["cmd-monitoring-status"]) {
        const monitoringStatus = await router.deviceMonitoringStatus();
        console.log("Monitoring Status:", monitoringStatus);
    }

    if (opt["cmd-monitoring-traffic-statistics"]) {
        const monitoringTrafficStatistics = await router.deviceMonitoringTrafficStatistics();
        console.log("Monitoring Traffic Statistics:", monitoringTrafficStatistics);
    }

    if (opt["cmd-net-current-plmn"]) {
        const netCurrentPlmn = await router.deviceNetCurrentPlmn();
        console.log("Net Current Plmn:", netCurrentPlmn);
    }

    if (opt["cmd-net-plmn-list"]) {
        const netPlmnList = await router.deviceNetPlmnList();
        console.log("Net Plmn List:", netPlmnList);
    }

    if (opt["cmd-control-reboot"]) {
        const controlReboot = await router.deviceControlReboot();
        console.log("Control Reboot:", controlReboot);
    }

    if (opt["cmd-net-register"]) {
        const netRegister = await router.deviceNetRegister(undefined, parseInt(opt['arg-plmn'], 10), parseInt(opt['arg-rat'], 10));
        console.log("Net Register:", netRegister);
    }

    if (opt["cmd-net-mode-automatic"]) {
        const netModeAutomatic = await router.deviceNetModeAutomatic();
        console.log("Net Mode Automatic:", netModeAutomatic);
    }

    if (opt["cmd-analyze-all-networks"]) {
        const analyzeAllNetworks = await router.analyzeAllNetworks();
        console.log("Analyze All Networks:", Util.inspect(analyzeAllNetworks, {depth: null}));
    }

    if (opt["cmd-connect-to-best-network"]) {
        const connectToBestNetwork = await router.connectToBestNetwork();
        console.log("Connect To Best Network:", Util.inspect(connectToBestNetwork, {depth: null}));
    }

})();
