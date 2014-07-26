var api = require('./api.js'),
	vm = require('vm'),
	fs = require('fs'),
	log = require('./log.js');
/**
 * Provides a script object that allows a server to handle the loaded script
 * @class Script
 * @module script
 * @param {string} path The path to the script
 * @param {Server} server The server this script is on
 * @param {number} sid The script identifier for this script
 * @constructor
 */
module.exports = function(path,server,sid){
	var self = this,
		watcher = {
			close: function(){}
		},i;
	self.api = {
		
	};
	for(i in api){
		self.api[i] = api[i];
	}
	/**
	 * stores the script identifier
	 * @property sid
	 * @type {number}
	 * @static
	 */
	Object.defineProperty(self,'sid',{
		value: sid,
		enumerable: true
	});
	/**
	 * Stores a reference to the server that this script is used on
	 * @property server
	 * @type {Server}
	 * @static
	 */
	Object.defineProperty(self,'server',{
		value: server,
		enumerable: true
	});
	/**
	 * The path to the script that is run
	 * @property path
	 * @type {string}
	 */
	self.path = path;
	/**
	 * Boolean determining if the script is currently active
	 * @property enabled
	 * @type {Boolean}
	 */
	self.enabled = false;
	/**
	 * reloads the script from the disk
	 * @method reload
	 * @chainable
	 */
	self.reload = function(){
		log.log('reloading script');
		try{
			d = fs.readFileSync(path);
			self.api._path = self.path;
			self.api.server = self.server;
			self.api.sid = self.sid;
			self.api.config = self.server.config;
			vm.runInNewContext(d,self.api,self.path);
			self.enabled = true;
		}catch(e){
			log.trace();
			log.error(e);
			self.disable();
		}
	};
	/**
	 * Disables the script (hooks, commands etc)
	 * @method disable
	 * @chainable
	 */
	self.disable = function(){
		self.server.run(sid,function(){
			self.server.off();
			self.server.remove();
			self.enabled = false;
		});
		return self;
	};
	/**
	 * Description
	 * @method enable
	 * @chainable
	 */
	self.enable = function(){
		self.disable();
		watcher = fs.watch(self.path,function(e,npath){
			if(e == 'change' && self.enabled){
				self.reload();
			}else if(e == 'rename'){
				self.path = npath;
			}
		});
		self.reload();
		return self;
	};
	/**
	 * Disables and removes the script from the server.
	 * @method remove
	 * @chainable
	 */
	self.remove = function(){
		watcher.close();
		self.disable();
		self.server.scripts[sid-1] = null;
		return self;
	};
	self.enable();
	return self;
};