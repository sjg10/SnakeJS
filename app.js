/**
 * @file app.js
 * The main server app.
 */ 

var
    port            = process.env.PORT || 4004,
    express         = require('express'),
    http            = require('http'),
    app             = express(),
    fs              = require('fs'),
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
    var file = __dirname + '/' + req.params[0];
    //Send the requesting client the file.
    if (fs.existsSync(file)) {
        console.log('fetching %s',file);
        res.sendfile(file );
    }
    else {
        res.status(404)        // HTTP status 404: NotFound
        .send('<font size=30><b>ERROR 404:</b><br>File not found</fontsize>');
    }
});

