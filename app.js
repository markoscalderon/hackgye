
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

app.get("/participants/total", function(req,res){
	if (process.env.REDISTOGO_URL) {
		//if you want to test locally and delete the IF
		//var redis = require("redis").createClient();
		
		var rtg   = require("url").parse(process.env.REDISTOGO_URL);
		var redis = require("redis").createClient(rtg.port, rtg.hostname);
		redis.auth(rtg.auth.split(":")[1]);
		
		redis.llen("hackgye:registers",function(error,num){
			res.json({
				total: num
			});
		});
	}else{
		res.render("500");
	}
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
		res.render('index', { msg: errors.join(',') });
	}
	else{
		var fullname = req.param('fullname');
		var email = req.param('email');
		var twitter = req.param('twitter');
		
		/* Saving the participant info */
		if (process.env.REDISTOGO_URL) {
			//if you want to test locally and delete the IF
			//var redis = require("redis").createClient();
			
			var rtg   = require("url").parse(process.env.REDISTOGO_URL);
			var redis = require("redis").createClient(rtg.port, rtg.hostname);
			redis.auth(rtg.auth.split(":")[1]);
			
			
			redis.incr( 'nextid' , function( err, id ) {
				/* a hash with the details of the participant */
				redis.hmset("hackgye:participant:" + id
					,"fullname",fullname
					,"email",email
					,"twitter",twitter
				);
				/* save a list of participants */
				redis.lpush("hackgye:registers", id);
			}
			
		} 

		/* send an email to the admins with the new register */
		if (process.env.SENDGRID_USERNAME) {
			var mailer = require("mailer");
			var sgusername = process.env.SENDGRID_USERNAME;
			var sgpassword = process.env.SENDGRID_PASSWORD;
			mailer.send({
		    	host : "smtp.sendgrid.net",
		    	port : "587",
		    	domain : "heroku.com",
		    	to : "mcmarkos86@gmail.com",
		    	from : "noreply@hackgye.com",
		    	subject : "Un nuevo registro para el HackGye",
		    	body: "Nombre:"+fullname+",Email:"+email+",Twitter:"+twitter,
		    	authentication : "login",
		    	username : sgusername,
		    	password : sgpassword
		  	},
		  	function(err, result){
		    	if(err){
		      		console.log(err);
		    	}
			});
		}
		
		res.render('index', { msg: "registro exitoso!" });
		
	}
});

// Configuration port for Heroku
var port = process.env.PORT || 3000;
app.listen(port, function() {
  console.log("Listening on " + port);
});

console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
