// Includes
var Express     = require("express"),
	app         = Express(),
	Config      = require("./config"),
	Couchbase   = require("couchbase"),
	Ottoman     = require("ottoman"),
	UserAgent   = require("express-useragent"), // https://github.com/biggora/express-useragent
	RequestIp   = require("request-ip"),
	Http        = require("http");
	//BodyParser  = require("body-parser"); // for correct POST requests


// Init
app.set("port", 8080);

app.use(UserAgent.express());
app.use(RequestIp.mw());

app.set("view engine", "ejs"); //TODO: remove tables & add bootstrap to templates!
app.use(Express.static(__dirname + "/public"));

//app.use(BodyParser.json());
//app.use(BodyParser.urlencoded({ extended: true }));

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

require("./routes")(app);

// Start Server listening
Http.createServer(app).listen(app.get("port"), function() {
	console.log("Express server listening on port " + app.get("port"));
});
