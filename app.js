var
    port            = 80
    express         = require('express'),
    http            = require('http'),
    app             = express(),
    server          = http.createServer(app);


server.listen(gameport)
console.log('Snake listening on ' + gameport );

/* Forward / to index.html */
app.get( '/', function( req, res ){
    console.log('trying to load %s', __dirname + '/index.html');
    res.sendfile( '/index.html' , { root:__dirname });
});

/* Serve any other request unredirected */
app.get( '/*' , function( req, res, next ) {
    var file = req.params[0];
        //Send the requesting client the file.
    res.sendfile( __dirname + '/' + file );
});

