const dgram = require('dgram');

module.exports = class LisaDiscovery {
    constructor(config = {}) {
        this.multicastAddress = config.multicastAddress;
        this.multicastPort = config.multicastPort;
        this.trigger = config.trigger;
        this.callback = config.callback;
    }

    start(socketBoundCallback) {
        let multicastPort = this.multicastPort
        let multicastAddress = this.multicastAddress
        let trigger = this.trigger
        let callback = this.callback
        this.socket = dgram.createSocket({type: 'udp4', reuseAddr: true});
        let socket = this.socket

        socket.bind(multicastPort, function () {
            socket.addMembership(multicastAddress);
            if (socketBoundCallback != null) {
                socketBoundCallback(socket)
            }
        });

        socket.on('message', function (data, rinfo) {
            let input = data.toString().trim()
            if (input.startsWith(trigger)) {
                let message = callback(input, rinfo.address)
                if (message != null) {
                    setTimeout(() => {
                        socket.send(Buffer.from(message),
                            0,
                            message.length,
                            multicastPort,
                            multicastAddress,
                            function (err) {
                                if (err) console.log(err);
                                else console.log(message);
                            }
                        );
                    }, 800);
                }
            }
        });

        this.socket.on('error', function (err) {
            console.log(err);
        });
    }

    stop() {
        if (this.socket) {
            try {
                this.socket.close();
            } catch (e) {
                //ignore errors
            }
        }
    }

    sendMessage(message, callback) {
        if (this.socket) {
            this.socket.send(Buffer.from(message),
                0,
                message.length,
                this.multicastPort,
                this.multicastAddress,
                callback
            );
        }
    }
}
