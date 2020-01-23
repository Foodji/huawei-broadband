# huawei-broadband

This is a library / binary to control Huawei-based broadband USB sticks.


## Setup

Run `npm i`.


## Run

```
Usage:
  node run [OPTION]

Options:
      --routerip=ROUTERIP                 router ip
      --proxy=PROXY                       proxy
      --cmd-monitoring-status             monitoring status
      --cmd-monitoring-traffic-statistics monitoring traffic statistics
      --cmd-net-current-plmn              net current plmn
      --cmd-net-plmn-list                 net plmn list
      --cmd-control-reboot                control reboot
      --cmd-net-register                  net register
      --cmd-net-mode                      net mode
      --cmd-analyze-all-networks          analyze all networks
      --cmd-connect-to-best-network       connect to best network
      --cmd-get-dialup-connection         get dialup connection
      --cmd-set-dialup-connection         set dialup connection
      --cmd-get-dialup-profiles           get dialup profiles
      --cmd-create-dialup-profile         create dialup profile
      --cmd-set-default-dialup-profile    set default dialup profile
      --cmd-upsert-dialup-profile         upsert dialup profile
      --arg-rat=RAT                       net rat
      --arg-plmn=PLMN                     net plmn
      --arg-net-mode=NETMODE              net mode
      --arg-data-roaming=true/false       set data roaming (default true)
      --arg-auto-disconnect=true/false    set auto disconnect (default false)
      --arg-make-default=true/false       make new profile default (default false)
      --arg-profile-name=PROFILENAME      profile name
      --arg-apn-name=APNNAME              apn name
      --arg-user-name=USERNAME            user name
      --arg-password=PASSWORD             password
  -h, --help                              display this help
```


## Contributors

- Foodji
- Oliver Friedmann


## License

Apache-2.0


