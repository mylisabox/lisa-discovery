const dgram = require('dgram');
const os = require('os');
const socket = dgram.createSocket({type: 'udp4', reuseAddr: true});

const LisaDiscovery = require('..')

let discovery = new LisaDiscovery({
    multicastAddress: '239.6.6.6',
    multicastPort: 5544,
    trigger: 'lisa-voice-search',
    callback: () => {
        const ifaces = os.networkInterfaces();

        Object.keys(ifaces).forEach(function (ifname) {
            let alias = 0;

            ifaces[ifname].forEach(function (iface) {
                if ('ipv4' !== iface.family.toLowerCase() || iface.internal !== false) {
                    // skip over internal (i.e. 127.0.0.1) and non-ipv4 addresses
                    return;
                }

                if (alias >= 1) {
                    // this single interface has multiple ipv4 addresses
                    console.log(ifname + ':' + alias, iface.address);
                } else {
                    // this interface has only one ipv4 adress
                    console.log(ifname, iface.address);
                }
                ++alias;
            });
        });


        return '{type: "lisa-voice", ip: ""}'
    },
})

discovery.start()

const testMessage = 'lisa-voice-search';
const multicastAddress = '239.6.6.6';
const multicastPort = 5544;


socket.bind(multicastPort, function () {
    socket.addMembership(multicastAddress);
});

socket.on("message", function (data, rinfo) {
    console.log("Message received from ", rinfo.address, " : ", data.toString());
});

socket.on("error", function (err) {
    console.log(err);
});

socket.send(Buffer.from(testMessage),
    0,
    testMessage.length,
    multicastPort,
    multicastAddress,
    function (err) {
        if (err) console.log(err);

        console.log("Message sent");
    }
);

