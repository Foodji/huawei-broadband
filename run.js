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
    ["", "cmd-net-mode", "net mode"],
    ["", "cmd-analyze-all-networks", "analyze all networks"],
    ["", "cmd-connect-to-best-network", "connect to best network"],
    ["", "cmd-get-dialup-connection", "get dialup connection"],
    ["", "cmd-set-dialup-connection", "set dialup connection"],
    ["", "cmd-get-dialup-profiles", "get dialup profiles"],
    ["", "cmd-create-dialup-profile", "create dialup profile"],
    ["", "cmd-set-default-dialup-profile", "set default dialup profile"],
    ["", "cmd-upsert-dialup-profile", "upsert dialup profile"],
    ["", "cmd-get-mobile-data-switch", "get mobile data switch"],
    ["", "cmd-set-mobile-data-switch", "set mobile data switch"],
    ["", "arg-rat=RAT", "net rat"],
    ["", "arg-plmn=PLMN", "net plmn"],
    ["", "arg-net-mode=NETMODE", "net mode"],
    ["", "arg-mobile-data-switch=true/false", "set mobile data switch (default true)"],
    ["", "arg-data-roaming=true/false", "set data roaming (default true)"],
    ["", "arg-auto-disconnect=true/false", "set auto disconnect (default false)"],
    ["", "arg-make-default=true/false", "make new profile default (default false)"],
    ["", "arg-profile-name=PROFILENAME", "profile name"],
    ["", "arg-apn-name=APNNAME", "apn name"],
    ["", "arg-user-name=USERNAME", "user name"],
    ["", "arg-password=PASSWORD", "password"],
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
        const netRegister = await router.deviceNetRegister(undefined, opt['arg-plmn'] ? parseInt(opt['arg-plmn'], 10) : undefined, opt['arg-rat'] ? parseInt(opt['arg-rat'], 10) : undefined);
        console.log("Net Register:", netRegister);
    }

    if (opt["cmd-net-mode"]) {
        const netMode = await router.deviceNetMode(undefined, opt['arg-net-mode']);
        console.log("Net Mode:", netMode);
    }

    if (opt["cmd-analyze-all-networks"]) {
        const analyzeAllNetworks = await router.analyzeAllNetworks();
        console.log("Analyze All Networks:", Util.inspect(analyzeAllNetworks, {depth: null}));
    }

    if (opt["cmd-connect-to-best-network"]) {
        const connectToBestNetwork = await router.connectToBestNetwork();
        console.log("Connect To Best Network:", Util.inspect(connectToBestNetwork, {depth: null}));
    }

    if (opt["cmd-get-dialup-connection"]) {
        const getDialupConnection = await router.deviceGetDialupConnection();
        console.log("Get Dialup Connection:", getDialupConnection);
    }

    if (opt["cmd-set-dialup-connection"]) {
        const setDialupConnection = await router.deviceSetDialupConnection(undefined, opt['arg-data-roaming'] !== "false", opt['arg-auto-disconnect'] === "true");
        console.log("Set Dialup Connection:", setDialupConnection);
    }

    if (opt["cmd-get-dialup-profiles"]) {
        const getDialupProfiles = await router.deviceGetDialupProfiles();
        console.log("Get Dialup Profiles:", getDialupProfiles);
    }

    if (opt["cmd-create-dialup-profile"]) {
        const createDialupProfile = await router.deviceCreateDialupProfile(undefined, opt['arg-make-default'] === 'true', opt['arg-profile-name'], opt['arg-apn-name'], opt['arg-user-name'], opt['arg-password']);
        console.log("Create Dialup Profile:", createDialupProfile);
    }

    if (opt["cmd-set-default-dialup-profile"]) {
        const setDefaultDialupProfile = await router.deviceSetDefaultDialupProfile(undefined, parseInt(opt['arg-profile-index'], 10));
        console.log("Set Default Dialup Profile:", setDefaultDialupProfile);
    }

    if (opt["cmd-upsert-dialup-profile"]) {
        const upsertDialupProfile = await router.upsertDialupProfile(undefined, opt['arg-make-default'] === 'true', opt['arg-profile-name'], opt['arg-apn-name'], opt['arg-user-name'], opt['arg-password']);
        console.log("Upsert Dialup Profile:", upsertDialupProfile);
    }

    if (opt["cmd-get-mobile-data-switch"]) {
        const getMobileDataSwitch = await router.deviceGetMobileDataSwitch();
        console.log("Get Mobile Data Switch:", getMobileDataSwitch);
    }

    if (opt["cmd-set-mobile-data-switch"]) {
        const setMobileDataSwitch = await router.deviceSetMobileDataSwitch(undefined, opt['arg-mobile-data-switch'] !== "false");
        console.log("Set Mobile Data Switch:", setMobileDataSwitch);
    }

})();
