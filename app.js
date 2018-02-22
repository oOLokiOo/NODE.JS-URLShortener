// Includes
var Express     = require("express"),
	app         = Express(),
	//middleware = require("./middleware")(app),
	Config      = require("./config"),
	Couchbase   = require("couchbase"),
	Ottoman     = require("ottoman"),
	ShortHash   = require("shorthash"), // https://github.com/bibig/node-shorthash
	UserAgent   = require("express-useragent"), // https://github.com/biggora/express-useragent
	WhereRegion = require('node-where'), // https://github.com/venables/node-where
	RequestIp   = require("request-ip"),
	BodyParser  = require("body-parser"),
	Http        = require("http");


// Init
app.set("port", 8080);

app.use(UserAgent.express());
app.use(RequestIp.mw());

app.set("view engine", "ejs"); //TODO: remove tables & add bootstrap to templates!!!
app.use(Express.static(__dirname + "/public"));

app.use(BodyParser.json());
app.use(BodyParser.urlencoded({ extended: true }));

// prepare DB
var cluster = new Couchbase.Cluster(Config.db.host);
cluster.authenticate(Config.db.user, Config.db.pass);
Ottoman.bucket = cluster.openBucket(Config.db.bucket);
Ottoman.store = new Ottoman.CbStoreAdapter(Ottoman.bucket, Couchbase);

// check DB connection
Ottoman.bucket.on("error", function(err) {
    console.log("CONNECT ERROR:", err);
});
Ottoman.bucket.on("connect", function() {
    console.log("CONNECTED to Couchbase - Successful!");
});


// UserUrl model schema
var UserUrlModel = Ottoman.model("UserURL", {
		originalURL:     {type: "string", default: ""},
		shortUrlPublic:  {type: "string", default: ""},
		shortUrlPrivate: {type: "string", default: ""},
		created:         {type: "Date", default: Date.now},
		hash:            {type: "string", default: ""}, // readonly: true
		users: [{
	        ip: {type: "string", default: ""},
	        os: {type: "string", default: ""},
	        browser: {type: "string", default: ""},
	        region:  {type: "string", default: ""},
	        clicks:  {type: "integer", default: 0}
		}]
	}, {
		index: {
			findByHash: {
				by: "hash"
			}
		}
	}
);
//Ottoman.ensureIndices(function(){});


// Start Server listening
Http.createServer(app).listen(app.get("port"), function() {
	console.log("Express server listening on port " + app.get("port"));
});


// Routes
app.get("/r/:hash", function(req, res, next) {
	res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate"); // HTTP 1.1.
	res.setHeader("Pragma", "no-cache"); // HTTP 1.0.
	res.setHeader("Expires", "0"); // Proxies.

	UserUrlModel.findByHash(req.params.hash, function(error, UserUrl) {
		if (error) return res.status(400).send(error);

		let redirectUrl = (UserUrl[0] != undefined ? UserUrl[0]["originalURL"] : "");

		if (redirectUrl != "") {
			// update link clicks
			UserUrl[0]["users"][0]["clicks"]++;

			// add Model to DB
			//UserUrl.save(function(error, result){});

			res.writeHead(302, { Location: redirectUrl });
			res.end();
		} else {
			next();
		}
	});
});

app.get("/p/:hash", function(req, res, next) {
	UserUrlModel.findByHash(req.params.hash.slice(0, - 1), function(error, UserUrl) {
		if (error) return res.status(400).send(error);

		if (UserUrl[0] != undefined) {
			UserUrl[0]["created"] = UserUrl[0]["created"].toLocaleDateString().replace(/-/g, ".") 
				+ " in " 
				+ UserUrl[0]["created"].toLocaleTimeString();

			res.render("pages/private", {
				// put some variables for template here
				UserUrl: UserUrl[0]
			});
		} else {
			next();
		}
	});
});

app.get("/", function(req, res) {
	var UserUrl = new UserUrlModel();
	// TODO: get all Documents
	/*
		UserUrlModel.find({}, function(error, data) {
		if (error) return res.status(400).send(error);

		AllUserUrls = data;
	});
	*/

	// check if originalURL is in POST
	if (req.query.originalURL != undefined) {
		var region = "unknown";
		var hash = ShortHash.unique(req.query.originalURL + (new Date).getTime());
		var ip = (Config.localTestMode == true ? "178.168."+((Math.floor(Math.random() * (176 - 128)) + 128)+".0") : RequestIp.getClientIp(req)); // Just for Local tests

		WhereRegion.is(ip, function (err, result) {
			if (result) {
				region = (result.get("country") + " ("+result.get("countryCode")+")");
			}

			// setup Model for save
			UserUrl.originalURL     = req.query.originalURL;
			UserUrl.shortUrlPublic  = "r/" + hash; // url to redirect
			UserUrl.shortUrlPrivate = "p/" + hash + "+"; // url to show private zone
			UserUrl.hash            = hash;
			UserUrl.users[0] = {
				"ip": ip,
				"os": req.useragent.os,
				"browser": req.useragent.browser + " " + req.useragent.version,
				"region": region,
				"clicks": 0
			};

			// add Model to DB
			UserUrl.save(function(error, result) {
				if (error) return res.status(400).send(error);

				console.log("Save successful!");
			});

			console.log(UserUrl);

			res.render("pages/index", {
				// put some variables for template here
				UserUrl: UserUrl
			});
		});
	} else {
		res.render("pages/index", {
			// put some variables for template here
			UserUrl: UserUrl
		});
	}
});

app.use(function(req, res) {
	res.status(404).send(res.render("pages/404"));
	//res.send(404, res.render("pages/404")); // is deprecated...
});
