"use strict";

// Dependencies
const { runJobs } = require("parallel-park")
const request = require("request-async")
const shellJS = require("shelljs")
const _ = require("lodash")
const fs = require("fs")

// Main
setInterval(async function(){
    const blockedIPs = shellJS.exec("sudo iptables --list-rules", { silent: true }).stdout

    var ips = shellJS.exec("sudo cat /var/log/auth.log", { silent: true }).stdout.match(/\b(?:(?:2(?:[0-4][0-9]|5[0-5])|[0-1]?[0-9]?[0-9])\.){3}(?:(?:2([0-4][0-9]|5[0-5])|[0-1]?[0-9]?[0-9]))\b/gim)

    if(ips){
        ips = _.uniq(ips)

        await runJobs(
            ips,
            async(ip, index, max)=>{
                if(blockedIPs.indexOf(ip) === -1){
                    var response = await request(`https://l3p-tick.vercel.app/api/ip/info?ip=${ip}`)
                    response = JSON.parse(response.body).data
        
                    if(response.proxy){
                        console.log(`Proxy detected: ${ip}`)
                        shellJS.exec(`sudo iptables -D INPUT -s ${ip} -j DROP`, { silent: true })
                    }
                }
            }
        )

        shellJS.exec("sudo cp /dev/null /var/log/auth.log", { silent: true })
    }
}, 3000)