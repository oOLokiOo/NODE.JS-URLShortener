var Ottoman = require("ottoman"),
	Config  = require("../config");


// UserUrl model Schema
var UserUrlModel = Ottoman.model("UserURL", {
		originalURL:     {type: "string", default: ""},
		shortUrlPublic:  {type: "string", default: ""},
		shortUrlPrivate: {type: "string", default: ""},
		created:         {type: "Date", default: Date.now},
		hash:            {type: "string", default: ""},
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
// Ottoman.ensureIndices(function(){});


UserUrlModel.getClientIp = function() {
	return (Config.localTestMode == true 
		? "178.168."+((Math.floor(Math.random() * (176 - 128)) + 128)+".0") 
		: RequestIp.getClientIp(req));
}

UserUrlModel.dateToCustomFormat = function(UserUrl) {
	return UserUrl["created"].toLocaleDateString().replace(/-/g, ".") 
					+ " in " 
					+ UserUrl["created"].toLocaleTimeString();
}

UserUrlModel.getSumUrlClicks = function(AllUserUrls) {
	for (let i = 0; i < AllUserUrls.length; i++) {
		AllUserUrls[i]["clicksSum"] = 0;

		for (let j = 0; j < AllUserUrls[i].users.length; j++) {
			AllUserUrls[i]["clicksSum"] += AllUserUrls[i].users[j]["clicks"];
		}
	}

	return AllUserUrls;
}

UserUrlModel.checkIfUsersClicked = function(UserUrl, ip) {
	let userId = false;

	for (let i = 0; i < UserUrl.users.length; i++) {
		if (UserUrl.users[i]["ip"] == ip) {
			userId = i;
			break;
		}
	}

	return userId;
}


module.exports = UserUrlModel;
