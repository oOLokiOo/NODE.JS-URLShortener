var UserUrlModel = require("../models/UserUrl"),
	UserUrl      = new UserUrlModel(),
	Config       = require("../config"),
	ShortHash    = require("shorthash"), // https://github.com/bibig/node-shorthash
	WhereRegion  = require("node-where"); // https://github.com/venables/node-where


function doRedirect(res, url) {
	res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate"); // HTTP 1.1.
	res.setHeader("Pragma", "no-cache"); // HTTP 1.0.
	res.setHeader("Expires", "0"); // Proxies.

	res.writeHead(302, { Location: url });
	res.end();
}


module.exports = function(app) {
	// redirect from short link to original
	app.get("/r/:hash", function(req, res, next) {
		UserUrlModel.findByHash(req.params.hash, function(error, UserUrl) {
			if (error) return res.status(400).send(error);

			let redirectUrl = (UserUrl[0] != undefined ? UserUrl[0]["originalURL"] : "");

			if (redirectUrl != "") {
				// update link clicks
				UserUrl[0]["users"][0]["clicks"]++;

				// add Model to DB
				UserUrl[0].save(function(error, result) {
					if (error) return res.status(400).send(error);
					console.log("Save successful!");
				});

				doRedirect(res, redirectUrl);
			} else {
				next();
			}
		});
	});


	// show private link in details
	app.get("/p/:hash", function(req, res, next) {
		// slice last symbol "+" in private link
		UserUrlModel.findByHash(req.params.hash.slice(0, - 1), function(error, UserUrl) {
			if (error) return res.status(400).send(error);

			if (UserUrl[0] != undefined) {
				// convert CREATED date to custom format
				UserUrl[0]["created"] = UserUrl[0]["created"].toLocaleDateString().replace(/-/g, ".") 
					+ " in " 
					+ UserUrl[0]["created"].toLocaleTimeString();

				res.render("pages/private", {
					UserUrl: UserUrl[0],
					HttpUrl: Config.httpUrl
				});
			} else {
				next();
			}
		});
	});


	// show home page 
	app.get("/", function(req, res, next) {
		// get all short links
		UserUrlModel.find({}, function(error, AllUserUrls) {
			if (error) return res.status(400).send(error);

			// check if original URL exists in POST
			if (req.query.originalURL != undefined) {
				var region = "unknown";
				var hash = ShortHash.unique(req.query.originalURL + (new Date).getTime());
				// convert IP to custom format (just for local tests)
				var ip = (Config.localTestMode == true 
					? "178.168."+((Math.floor(Math.random() * (176 - 128)) + 128)+".0") 
					: RequestIp.getClientIp(req));
				
				// get region by ip
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
				});
			}

			res.render("pages/index", {
				UserUrl: UserUrl,
				AllUserUrls: AllUserUrls,
				HttpUrl: Config.httpUrl
			});
		});
	});


	// show 404 page
	app.use(function(req, res) {
		res.status(404).send(res.render("pages/404"));
	});
};
