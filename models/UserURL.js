Ottoman = require("ottoman");

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


//UserUrlModel.updateClicks() {};

module.exports = UserUrlModel;
