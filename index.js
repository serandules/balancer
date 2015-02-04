var debug = require('debug')('serandules:balancer');
var agent = require('hub-agent');

agent(function () {
    var http = require('http');
    var https = require('https');
    var fs = require('fs');
    var httpProxy = require('http-proxy');
    var httpsPrxy = httpProxy.createProxyServer({
        procevent: http.globalAgent
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
            debug('backend server not found for host : ' + req.headers['host']);
            res.writeHead(404, 'Not Found');
            res.end();
            return;
        }
        debug(target);
        httpsPrxy.web(req, res, {
            target: target
        });
    });

    httpsServer.on('upgrade', function (req, socket, head) {
        var target = req.headers ? hosts[req.headers['host']] : null;
        if (!target) {
            debug('backend server not found for host : ' + req.headers['host']);
            res.writeHead(404, 'Not Found');
            res.end();
            return;
        }
        httpsPrxy.ws(req, socket, head, {
            target: target
        });
    });

    httpsServer.listen(443);
});

process.on('uncaughtException', function (err) {
    debug('unhandled exception ' + err);
    debug(err.stack);
});

debug('balancer started successfully');