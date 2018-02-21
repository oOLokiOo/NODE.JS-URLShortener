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
//console.log(ShortHash.unique('https:/google.com'));

app.set("port", 8080);
app.set("view engine", "ejs");
app.use(Express.static(__dirname + "/public"));

http.createServer(app).listen(app.get("port"), function(){
	console.log("Express server listening on port " + app.get("port"));
});


// Routes
app.get("/", function(req, res) {
	res.render("pages/index", {
		// put some variables for template here
	});
});
