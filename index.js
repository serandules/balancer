var http = require('http');
var https = require('https');
var fs = require('fs');
var httpProxy = require('http-proxy');
//var httpPrxy = httpProxy.createProxyServer();
var httpsPrxy = httpProxy.createProxyServer();

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

/*var httpServer = http.createServer(function (req, res) {
 var target = req.headers ? hosts[req.headers['host']] : null;
 if (!target) {
 console.log('backend server not found for host : ' + req.headers['host']);
 res.writeHead(404, 'Not Found');
 res.end();
 return;
 }
 httpPrxy.web(req, res, {
 target: target
 });
 }).listen(80);

 httpServer.on('upgrade', function (req, socket, head) {
 var target = req.headers ? hosts[req.headers['host']] : null;
 if (!target) {
 console.log('backend server not found for host : ' + req.headers['host']);
 res.writeHead(404, 'Not Found');
 res.end();
 return;
 }
 httpPrxy.ws(req, socket, head, {
 target: target
 });
 });*/

var httpsServer = https.createServer({
    key: fs.readFileSync('/etc/ssl/serand/hub.key'),
    cert: fs.readFileSync('/etc/ssl/serand/hub.crt'),
    ca: [fs.readFileSync('/etc/ssl/serand/hub-client.crt')],
    requestCert: true
    //rejectUnauthorized: true
}, function (req, res) {
    var target = req.headers ? hosts[req.headers['host']] : null;
    if (!target) {
        console.log('backend server not found for host : ' + req.headers['host']);
        res.writeHead(404, 'Not Found');
        res.end();
        return;
    }
    console.log(target);
    httpsPrxy.web(req, res, {
        target: target
    });
}).listen(443);

httpsServer.on('upgrade', function (req, socket, head) {
    var target = req.headers ? hosts[req.headers['host']] : null;
    if (!target) {
        console.log('backend server not found for host : ' + req.headers['host']);
        res.writeHead(404, 'Not Found');
        res.end();
        return;
    }
    httpsPrxy.ws(req, socket, head, {
        target: target
    });
});

process.on('uncaughtException', function (err) {
    console.log('unhandled exception ' + err);
    console.log(err.stack);
});

console.log('balancer started successfully');