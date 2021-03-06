var log = require('logger')('balancer:index');
var clustor = require('clustor');

var self = '*.serandives.com';

clustor(function () {
    var http = require('http');
    var https = require('https');
    var fs = require('fs');
    var httpProxy = require('http-proxy');
    var procevent = require('procevent')(process);

    var httpsPrxy = httpProxy.createProxyServer({
        agent: http.globalAgent
    });

    var hosts = {
        'accounts.serandives.com': {
            host: 'accounts.serandives.com',
            port: 4002
        },
        'autos.serandives.com': {
            host: 'autos.serandives.com',
            port: 4004
        }
    };

    httpsPrxy.on('error', function (err, req, res) {
        res.writeHead(500, {
            'Content-Type': 'application/json'
        });
        res.end(JSON.stringify({
            error: 'proxy error'
        }));
    });

    var httpsServer = https.createServer({
        key: fs.readFileSync('/etc/ssl/serand/hub.key'),
        cert: fs.readFileSync('/etc/ssl/serand/hub.crt'),
        ca: [fs.readFileSync('/etc/ssl/serand/hub-client.crt')],
        requestCert: true
        //rejectUnauthorized: true
    }, function (req, res) {
        var target = req.headers ? hosts[req.headers['host']] : null;
        if (!target) {
            log.debug('backend server not found for host:%s', req.headers['host']);
            res.writeHead(404, 'Not Found');
            res.end();
            return;
        }
        log.debug(target);
        httpsPrxy.web(req, res, {
            target: target
        });
    });

    httpsServer.on('upgrade', function (req, socket, head) {
        var target = req.headers ? hosts[req.headers['host']] : null;
        if (!target) {
            log.debug('backend server not found for host:%s', req.headers['host']);
            return socket.end({
                error: 404
            });
        }
        httpsPrxy.ws(req, socket, head, {
            target: target
        });
    });

    httpsServer.listen(443);

    procevent.emit('started');

}, function (err, address) {
    log.info('drone started | domain:%s, address:%s, port:%s', self, address.address, address.port);
});

process.on('uncaughtException', function (err) {
    log.debug('unhandled exception %s', err);
    log.debug(err.stack);
});

log.debug('balancer started successfully');