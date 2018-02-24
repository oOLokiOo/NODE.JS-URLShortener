var	Ottoman = require("ottoman"),
	Config  = require("../config");


// UserUrl model Schema
var UserUrlModel = Ottoman.model("UserURL", {
		originalURL:     {type: "string", default: ""},
		shortUrlPublic:  {type: "string", default: ""},
		shortUrlPrivate: {type: "string", default: ""},
		created:         {type: "Date", default: Date.now},
		userId:          {type: "integer"}, // for extended functionality
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

UserUrlModel.getSumUrlClicks = function(allUserUrls) {
	for (let i = 0; i < allUserUrls.length; i++) {
		allUserUrls[i]["clicksSum"] = 0;

		for (let j = 0; j < allUserUrls[i].users.length; j++) {
			allUserUrls[i]["clicksSum"] += allUserUrls[i].users[j]["clicks"];
		}
	}

	return allUserUrls;
}

UserUrlModel.checkIfUsersClicked = function(userUrl, ip) {
	let userId = false;

	for (let i = 0; i < userUrl.users.length; i++) {
		if (userUrl.users[i]["ip"] == ip) {
			userId = i;
			break;
		}
	}

	return userId;
}


module.exports = UserUrlModel;
