var	UserUrlModel = require("../models/UserUrl"),
	//userUrl      = new UserUrlModel(),
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
		UserUrlModel.findByHash(req.params.hash, function(error, userUrl) {
			if (error) return res.status(400).send(error);

			var userUrl = userUrl[0];
			let redirectUrl = (userUrl != undefined ? userUrl["originalURL"] : "");

			// do action if hash exists in db
			if (redirectUrl != "") {
				// check for already clicked users
				let ip = UserUrlModel.getClientIp();
				let userId = UserUrlModel.checkIfUsersClicked(userUrl, ip);

				WhereRegion.is(ip, function (err, result) {
					if (result) region = (result.get("country") + " ("+result.get("countryCode")+")");

					if (userId > 0) userUrl["users"][userId]["clicks"]++;
					else {
						// attach new user to link
						userUrl.users.push({
							"ip": ip,
							"os": req.useragent.os,
							"browser": req.useragent.browser + " " + req.useragent.version,
							"region": region,
							"clicks": 1
						});
					}

					// add Model to DB
					userUrl.save(function(error, result) {
						if (error) return res.status(400).send(error);
						console.log("Save successful!");
					});
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
		UserUrlModel.findByHash(req.params.hash.slice(0, - 1), function(error, userUrl) {
			if (error) return res.status(400).send(error);

			var userUrl = userUrl[0];

			if (userUrl != undefined) {
				userUrl["created"] = UserUrlModel.dateToCustomFormat(userUrl);

				res.render("pages/private", {
					userUrl: userUrl,
					httpUrl: Config.httpUrl
				});
			} else {
				next();
			}
		});
	});


	// show home page 
	app.get("/", function(req, res, next) {
		// get all short links for main table list
		UserUrlModel.find({}, function(error, allUserUrls) {
			if (error) return res.status(400).send(error);

			let userUrl = new UserUrlModel();
			allUserUrls = UserUrlModel.getSumUrlClicks(allUserUrls);

			let renderPage = function() {
				res.render("pages/index", {
					userUrl: userUrl,
					allUserUrls: allUserUrls,
					httpUrl: Config.httpUrl
				})
			};

			// check if original URL exists in POST action
			if (req.query.originalURL == undefined) {
				renderPage();
				return;
			}

			// prepare Model for save
			let region = "unknown";
			let hash = ShortHash.unique(req.query.originalURL + (new Date).getTime());
			let ip = UserUrlModel.getClientIp();

			// get region by ip
			WhereRegion.is(ip, function (err, result) {
				if (result) region = (result.get("country") + " ("+result.get("countryCode")+")");

				userUrl.originalURL     = req.query.originalURL;
				userUrl.shortUrlPublic  = "r/" + hash; // url to redirect
				userUrl.shortUrlPrivate = "p/" + hash + "+"; // url to show private zone
				userUrl.hash            = hash;
				userUrl.users[0] = { // attach first user to link (user who created the link)
					"ip": ip,
					"os": req.useragent.os,
					"browser": req.useragent.browser + " " + req.useragent.version,
					"region": region,
					"clicks": 0
				};

				// add Model to DB
				userUrl.save(function(error, result) {
					if (error) return res.status(400).send(error);
					console.log("Save successful!");

					renderPage();
				});
			});
		});
	});


	// show 404 page
	app.use(function(req, res) {
		res.status(404).send(res.render("pages/404"));
	});
};
