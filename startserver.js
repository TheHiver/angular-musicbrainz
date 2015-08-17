var express = require('express');
var proxyMiddleware = require('http-proxy-middleware');
var context='/esapi/**';
var options = {
        target: 'http://localhost:9200', // target host
        changeOrigin: true,               // needed for virtual hosted sites
        ws: false,                         // proxy websockets
        pathRewrite: {
            '^/esapi' : ''      // rewrite paths
        }
    };
var apiProxy = proxyMiddleware(context, options);
var app = express();

var playerContext='/player/**';
var playerOptions = {
    target: 'http://www.musicnodes.com', // target host
    changeOrigin: true,               // needed for virtual hosted sites
    ws: false,                         // proxy websockets
    pathRewrite: {
        '^/player' : ''      // rewrite paths
    }
}
var playerProxy = proxyMiddleware(playerContext, playerOptions);

app.use('/', express.static(__dirname));
app.use(apiProxy);
app.use(playerProxy);
app.listen(3000, function() { console.log('listening')});
