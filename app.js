// Includes
var Express    = require("express");
var Couchbase  = require("couchbase");
var Ottoman    = require("ottoman");
var ShortHash  = require("shorthash"); // https://github.com/bibig/node-shorthash
var UserAgent  = require("express-useragent"); // https://github.com/biggora/express-useragent
var requestIp  = require("request-ip");
var http       = require("http");
//var BodyParser = require("body-parser");
var config     = require("./config/config.js");


// Init
var app = Express();

app.set("port", 8080);
app.set("view engine", "ejs");

app.use(UserAgent.express());
app.use(requestIp.mw());
app.use(Express.static(__dirname + "/public"));

var cluster = new Couchbase.Cluster(config.db.host);
cluster.authenticate(config.db.user, config.db.pass);
Ottoman.bucket = cluster.openBucket(config.db.bucket);

// check DB connection
Ottoman.bucket.on("error", function (err) {
    console.log("CONNECT ERROR:", err);
});
Ottoman.bucket.on("connect", function () {
    console.log("CONNECTED to Couchbase - Successful!");
});

// TODO: connect to normal DB here!!! NOW we have - Error: cannot perform operations on a shutdown bucket
var testDB = {
	"Zmp3qE": "http://ya.ru/",
	"16kevp": "http://google.com/"
}

var UserUrlModel = Ottoman.model("UserURL", {
		originalURL:     {type: "string", default: ""},
		shortUrlPublic:  {type: "string", default: ""},
		shortUrlPrivate: {type: "string", default: ""},
		created:         {type: "Date", default: Date.now},
		hash:            {type: "string", default: ""}, // readonly: true
		users: {
	        ip: {type: "string", default: ""},
	        os: {type: "string", default: ""},
	        browser: {type: "string", default: ""},
	        region:  {type: "string", default: ""} // AIzaSyB_tHW8Gk3tCQlyQQyERMIpD0uGW8Q6UwA - google api guest key
		}
	}, {
		///*
		index: {
			findByHash: {
				by: "hash",
				type: "string"
			}
		}
		//*/
		//id: "hash"
	}
);


// Start Server listening
http.createServer(app).listen(app.get("port"), function() {
	console.log("Express server listening on port " + app.get("port"));
});


// Routes
app.get("/r/:hash", function(req, res, next) {
	res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate"); // HTTP 1.1.
	res.setHeader("Pragma", "no-cache"); // HTTP 1.0.
	res.setHeader("Expires", "0"); // Proxies.

	// TODO:: redirect to originalURL here, by hash from normal DB !!!
	if (testDB[req.params.hash] != undefined) {
		res.writeHead(302,
			{Location: testDB[req.params.hash]}
		);
		res.end();
	} else {
		next();
	}
});

app.get("/p/:hash", function(req, res, next) {
	// TODO:: check for hash from normal DB !!!
	if (testDB[req.params.hash] != undefined) {
		res.render("pages/private", {
			// put some variables for template here
		});
	} else {
		next();
	}
});

app.get("/", function(req, res) {
	let UserUrl = new UserUrlModel();

	// check if originalURL is in POST
	if (req.query.originalURL != undefined) {
		let hash = ShortHash.unique(req.query.originalURL + (new Date).getTime());

		// setup Model
		UserUrl.originalURL     = req.query.originalURL;
		UserUrl.shortUrlPublic  = "r/" + hash; // url to redirect
		UserUrl.shortUrlPrivate = "p/" + hash + "+"; // url to show private zone
		UserUrl.hash            = hash;
		UserUrl.users.ip        = requestIp.getClientIp(req);
		UserUrl.users.os        = req.useragent.os;
		UserUrl.users.browser   = req.useragent.browser + " " + req.useragent.version;

		// add Model to DB
		UserUrl.save(function(error, result) {
			if (error) {
				return res.status(400).send(error);
			}

			console.log("Save successful!");
			console.log(result);
		});

		console.log(UserUrl);
	}

	res.render("pages/index", {
		// put some variables for template here
		originalURL:     UserUrl.originalURL,
		shortUrlPublic:  UserUrl.shortUrlPublic,
		shortUrlPrivate: UserUrl.shortUrlPrivate
	});
});

app.use(function(req, res) {
	res.status(404).send(res.render("pages/404"));
	//res.send(404, res.render("pages/404")); // is deprecated...
});
