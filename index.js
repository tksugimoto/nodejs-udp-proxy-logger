const assert = require('assert');
const dgram = require('dgram');
const log = require('./lib/log');
const {
    parse: parseUrl,
} = require('url');

assert(process.argv[2], 'remote address("hostname:port") required.');

const {
    hostname: REMOTE_HOSTNAME,
    port: REMOTE_PORT,
} = parseUrl(`http://${process.argv[2]}`);

assert(REMOTE_PORT, 'remote port number required.');

assert(process.argv[3], 'local bind address("[hostname:]port") required.');

const parseLocalBindInfo = (arg) => {
    if (/^\d+$/.test(arg)) {
        const port = Number(arg) || 0;
        return {
            port,
        };
    }
    const {
        hostname,
        port,
    } = parseUrl(`http://${arg}`);
    return {
        hostname,
        port: port || 0,
    };
};

const {
    hostname: LOCAL_HOSTNAME,
    port: LOCAL_PORT,
 } = parseLocalBindInfo(process.argv[3]);

const udpProxyServer = dgram.createSocket({
    type: 'udp4',
});

udpProxyServer.on('message', (requestMessage, client) => {
    log(`client -> server (client: ${client.address}:${client.port})`);
    console.info(requestMessage);

    const serverSocket = dgram.createSocket({
        type: 'udp4',
    });
    serverSocket.send(requestMessage, REMOTE_PORT, REMOTE_HOSTNAME);
    serverSocket.on('message', (responseMessage) => {
        log(`server -> client (client: ${client.address}:${client.port})`);
        console.info(responseMessage);
        udpProxyServer.send(responseMessage, client.port, client.address);
        serverSocket.close();
    });
});


udpProxyServer.on('listening', () => {
    const {
        address,
        port,
    } = udpProxyServer.address();
    console.info(`UDP server started. (IP:port = ${address}:${port})`);
    console.info(`transport to ${REMOTE_HOSTNAME}:${REMOTE_PORT}`);
});

udpProxyServer.bind(LOCAL_PORT, LOCAL_HOSTNAME);
