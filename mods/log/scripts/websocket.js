var settings = (function(){
		var s = require('../etc/config.json').logs.websocket;
		if(s.listeners === undefined){
			s.listeners = [];
		}
		return s;
	})(),
	i,
	servers = [],
	channels = {},
	handleConnect = function(c){
		console.log('Websocket connection');
		c.on('message',function(data){
			data = JSON.parse(data);
			switch(data.type){
				case 'sub':
					if(!channels[data.channel]){
						channels[data.channel] = [];
					}
					if(channels[data.channel].indexOf(c) == -1){
						channels[data.channel].push(c);
					}
				break;
			}
		});
		c.on('close',function(){
			var channel,i;
			for(i in channels){
				channel = channels[i];
				if(channel.indexOf(c)!=-1){
					channel.splice(channel.indexOf(c),1);
				}
			}
		});
	},
	handlePub = function(data){
		if(channels[data.channel]){
			var json = JSON.stringify(data);
			channels[data.channel].forEach(function(c){
				c.send(json);
			});
		}
	};
if(settings.host!==undefined&&settings.port!==undefined){
	settings.listeners.push({
		host: settings.host,
		port: settings.port
	});
}
for(i in settings.listeners){
	try{
		var l = settings.listeners[i],
			s = websocket.getServer(l.host,l.port)
				.hold(script)
				.on('connection',handleConnect);
		servers.push(s);
	}catch(e){
		log.trace(e);
	}
}
pubsub.sub('log',handlePub);
script.unload = function(){
	servers.forEach(function(){
		s.release(script);
	});
	servers = [];
	pubsub.unsub('log',handlePub);
};