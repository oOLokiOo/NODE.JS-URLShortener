// Includes
var Express    = require("express");
var Couchbase  = require("couchbase");
var Ottoman    = require("ottoman");
//var Hashids    = require("hashids");
var ShortHash  = require("shorthash"); // https://github.com/bibig/node-shorthash
var http       = require("http");
var BodyParser = require("body-parser");


// Init
var app = Express();

app.set("port", 8080);
app.set("view engine", "ejs");
app.use(Express.static(__dirname + "/public"));

var cluster = new Couchbase.Cluster('couchbase://127.0.0.1');
Ottoman.bucket = cluster.openBucket('default');

var UserURL = Ottoman.model('UserURL', {
	originalURL:     'string',
	shortUrlPublic:  'string',
	shortUrlPrivate: 'string',
});


// Start Server listening
http.createServer(app).listen(app.get("port"), function() {
	console.log("Express server listening on port " + app.get("port"));
});


// Routes
app.get("/", function(req, res) {
	var originalURL = "";
	var shortUrl    = "";

	if (req.query.originalURL != undefined) {
		originalURL = req.query.originalURL;
		shortUrl    = ShortHash.unique(originalURL);
	}

	res.render("pages/index", {
		// put some variables for template here
		originalURL: originalURL,
		shortUrl: shortUrl
	});
});

app.use(function(req, res, next) {
	res.send(404, res.render("pages/404"));
});
