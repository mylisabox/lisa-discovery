import dgram from 'dgram';

export default class LisaDiscovery {
    constructor(config = {}) {
        this.multicastAddress = config.multicastAddress;
        this.multicastPort = config.multicastPort;
        this.trigger = config.trigger;
        this.callback = config.callback;
    }

    _bindSocket(socket, socketBoundCallback, retryCallback, trialNumber) {
        if (trialNumber > 100)
            return;
        let multicastAddress = this.multicastAddress
        let trials = trialNumber || 1
        try {
            socket.addMembership(multicastAddress);
            if (socketBoundCallback != null) {
                socketBoundCallback(socket)
            }
        } catch (err) {
            if (err.code === 'ERR_SOCKET_DGRAM_NOT_RUNNING') {
                setTimeout(() => {
                    retryCallback()
                }, 1000)
            } else {
                let ms = 500 * trials
                setTimeout(() => {
                    this._bindSocket(socket, socketBoundCallback, retryCallback, trials + 1);
                }, ms);
            }
            console.log(err);
        }
    }

    start(socketBoundCallback) {
        let multicastPort = this.multicastPort
        let multicastAddress = this.multicastAddress
        let trigger = this.trigger
        let callback = this.callback
        this.stop()
        this.socket = dgram.createSocket({type: 'udp4', reuseAddr: true});
        let socket = this.socket

        socket.bind(multicastPort, () => {
            this._bindSocket(socket, socketBoundCallback, () => {
                this.start(socketBoundCallback)
            })
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
