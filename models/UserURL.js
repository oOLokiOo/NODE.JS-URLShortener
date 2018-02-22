Ottoman = require("ottoman");

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

//UserUrlModel.save = function(){}
//UserUrlModel.findAll = function(){};
//UserUrlModel.findByHash = function(){};
//UserUrlModel.updateClicks(){};

module.exports = UserUrlModel;
