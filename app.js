
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

app.get('/test',function(req,res){
	var email = require("mailer");
	var sgusername = process.env.SENDGRID_USERNAME;
	var sgpassword = process.env.SENDGRID_PASSWORD;
	email.send({
	    host : "smtp.sendgrid.net",
	    port : "587",
	    domain : "heroku.com",
	    to : "mcmarkos86@gmail.com",
	    from : "mcmarkos86@gmail.com",
	    subject : "This is a subject",
	    body: "Hello, this is a test body",
	    authentication : "login",
	    username : sgusername,
	    password : sgpassword
	  },
	  function(err, result){
	    if(err){
	      console.log(err);
	    }
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
		var fullname = req.param('fullname');
		var email = req.param('email');
		var twitter = req.param('twitter');
		
		/* Saving the participant info */
		if (process.env.REDISTOGO_URL) {
			var rtg   = require("url").parse(process.env.REDISTOGO_URL);
			var redis = require("redis").createClient(rtg.port, rtg.hostname);
			redis.auth(rtg.auth.split(":")[1]);
			
			/* a hash with the details of the participant */
			redis.hmset(email
				,"fullname",fullname
				,"email",email
				,"twitter",twitter
			);
			
			/* save a list of participants */
			redis.lpush("registers", email);
			
			
		} else {
			//if you want to test locally
			//var redis = require("redis").createClient();
		}

		/* send an email to the admins with the new register */
		
		
	}
});

// Configuration port for Heroku
var port = process.env.PORT || 3000;
app.listen(port, function() {
  console.log("Listening on " + port);
});

console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
