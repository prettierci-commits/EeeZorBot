var User = require('./user.js');
module.exports = function(name,users){
	this.name = name;
	this.users = users === undefined?[]:users;

	return this;
};