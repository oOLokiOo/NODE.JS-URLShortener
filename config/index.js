let Config = {};
Config.db  = {};
Config.mdb = {};

// Couchbase
Config.db.host   = "couchbase://localhost";
Config.db.bucket = "UserUrl";
Config.db.user   = "Administrator";
Config.db.pass   = "Administrator";

// Mongodb
/*
To connect using the mongo shell:
mongo ds245218.mlab.com:45218/user-url -u <dbuser> -p <dbpassword>
To connect using a driver via the standard MongoDB URI:
mongodb://<dbuser>:<dbpassword>@ds245218.mlab.com:45218/user-url
*/
Config.mdb.host   = "ds245218.mlab.com:45218/"; // https://mlab.com/
Config.mdb.bucket = "user-url";
Config.mdb.user   = "Administrator";
Config.mdb.pass   = "Administrator";

// Common
Config.localTestMode = true;

module.exports = Config;