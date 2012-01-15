
/**
 * Module dependencies.
 */

var express = require('express')
  , expressValidator = require('express-validator')
  , routes = require('./routes')

var app = module.exports = express.createServer(express.logger());

// Configuration
app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(expressValidator);
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function(){
  app.use(express.errorHandler()); 
});

// Routes
app.get('/', routes.index);

app.get('/test', function(req,res){
	
	if (process.env.REDISTOGO_URL) {
		var rtg   = require("url").parse(process.env.REDISTOGO_URL);
		var redis = require("redis").createClient(rtg.port, rtg.hostname);
		redis.auth(rtg.auth.split(":")[1]);
	} else {
		var redis = require("redis").createClient();
	}
	
	redis.set('foo', 'bar');

	redis.get('foo', function(err, value) {
		res.json({
			foo: value
		});
	});
	
	
});

app.post('/register', function(req, res){
	var errors = [];
	req.onValidationError(function(msg) {
		console.log('Validation error: ' + msg);
		errors.push(msg);
		return this;
	});
	
	req.assert('fullname', 'Tu nombre es requerido').notEmpty();
	req.assert('email', 'Tu email es requerido').notEmpty();
	req.assert('email', 'Email inválido').isEmail();
	
	if (errors.length) {
		res.render('index', { errors: errors.join(',') });
	}
	else{
		res.json({
			fullname: req.param('fullname'),
			email: req.param('email'),
			twitter: req.param('twitter')
		});
	}
});

// Configuration port for Heroku
var port = process.env.PORT || 3000;
app.listen(port, function() {
  console.log("Listening on " + port);
});

console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
