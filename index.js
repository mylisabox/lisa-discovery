const dgram = require('dgram');

module.exports = class LisaDiscovery {
    constructor(config = {}) {
        this.multicastAddress = config.multicastAddress;
        this.multicastPort = config.multicastPort;
        this.trigger = config.trigger;
        this.callback = config.callback;
    }

    start() {
        let multicastPort = this.multicastPort
        let multicastAddress = this.multicastAddress
        let trigger = this.trigger
        let callback = this.callback
        this.socket = dgram.createSocket({type: 'udp4', reuseAddr: true});
        let socket = this.socket

        socket.bind(multicastPort, function () {
            socket.addMembership(multicastAddress);
        });

        socket.on("message", function (data, rinfo) {
            if (data.toString().trim() === trigger) {
                let message = callback()
                socket.send(Buffer.from(message),
                    0,
                    message.length,
                    multicastPort,
                    multicastAddress,
                    function (err) {
                        if (err) console.log(err);
                    }
                );
            }
        });

        this.socket.on("error", function (err) {
            console.log(err);
        });
    }

    stop() {
        this.socket.close();
    }
}
