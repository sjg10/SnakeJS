/**
 * @file app.js
 * The main server app.
 */ 

var
    port            = 4004,
    express         = require('express'),
    http            = require('http'),
    app             = express(),
    server          = http.createServer(app);


/* Initialise server */
server.listen(port);
console.log('Snake listening on ' + port );

/* Forward / to index.html */
app.get( '/', function( req, res ){
    console.log('fetching %s', __dirname + '/index.html');
    res.sendfile( '/index.html' , { root:__dirname });
});

/* Serve any other request unredirected */
app.get( '/*' , function( req, res, next ) {
    var file = req.params[0];
        //Send the requesting client the file.
    console.log('fetching %s', __dirname + '/' + file);
    res.sendfile( __dirname + '/' + file );
});

