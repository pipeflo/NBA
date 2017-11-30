// an example todo bot
var botName = 'todo';
var todo = require('./todo');

// watson work configuration; use Bluemix user vars or add values below
// these are provided when you register your appliction
var webhookSecret = process.env.WEBHOOK_SECRET;
var appId = process.env.APP_ID;
var appSecret = process.env.APP_SECRET;

/**
 * getting started functions
 */

function messageCreated(body) {
	// your code here
	// message directed to the bot
	if (body.content.substring(0,botName.length+1) === `@${botName}`) {
		// for example, process a message
		todo.handleMessage(body, (err, reply) => {
			if(!err) {
				respond(reply ,body.spaceId,
		      (err, res) => {
		        // possibly handle result from watsonwork
		      });
			}
		});
	}
}

function spaceMembersAdded(body) {
	// your code here
}

function spaceMembersRemoved(body) {
	// your code here
}

function messageAnnotationAdded(body) {
	// your code here
	console.log(`${body.type} ${body.annotationType} ${body.annotationPayload}`);

	// an example of a focus
	if(body.annotationType === 'message-focus') {
		var payload = JSON.parse(body.annotationPayload);

		if(payload.lens === 'ActionRequest') {
			todo.handleActionRequest(body, (err, reply) => {

				if(reply){
					respond(reply, body.spaceId, (err, res) => {
			      // possibly handle result from watsonwork
			    });
				}
			});
		}
	}
}

function messageAnnotationEdited(body) {
	// your code here
}

function messageAnnotationRemoved(body) {
	// your code here
}

/**
 * end getting started
 **/

// dependencies
var express = require('express'),
	http = require('http'),
	path = require('path'),
	crypto = require('crypto'),
	bodyParser = require('body-parser'),
	methodOverride = require('method-override'),
	request = require('request');

var oauth = require('./oauth');

// set up express
var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(methodOverride());

// watson work services middleware
app.use(verifier);
app.use(ignorer);
app.use(webhook);

http.createServer(app).listen(app.get('port'), '0.0.0.0', function() {
	console.log(botName + ' bot listening on ' + app.get('port'));
	initialize();
});

/**
 * Middleware function to handle the Watson Work challenge
 */
function verifier(req, res, next) {
  if(req.body.type === 'verification') {
    console.log('Got Webhook verification challenge ' + req.body);

    var bodyToSend = {
      response: req.body.challenge
    };

    var hashToSend = crypto.createHmac('sha256', webhookSecret)
          .update(JSON.stringify(bodyToSend))
          .digest('hex');

    res.set('X-OUTBOUND-TOKEN', hashToSend);
    res.send(bodyToSend);
  } else {
		next();
	}
}

/**
 * Middleware function to ignore messages from this bot
 */
function ignorer(req, res, next){
	// Ignore our own messages
	if (req.body.userId === appId) {
		res.status(201).send().end();
		return;
	} else {
		console.log('Sending body to next middleware ' + JSON.stringify(req.body));
		next();
	}
}

/**
 * Middleware function to handle the webhook event
 */
function webhook(req, res, next) {
		switch(req.body.type) {
			case "message-created":
				messageCreated(req.body);
				break;
			case "space-members-added":
				spaceMembersAdded(req.body);
				break;
			case "space-members-removed":
				spaceMembersRemoved(req.body);
				break;
			case "message-annotation-added":
				messageAnnotationAdded(req.body);
				break;
			case "message-annotation-edited":
				messageAnnotationEdited(req.body);
				break;
			case "message-annotation-removed":
				messageAnnotationRemoved(req.body);
				break;
	}

	// you can acknowledge here or later; if later, uncomment next()
	// but you MUST respond or watsonwork will keep sending the message
	res.status(200).send().end();
	// next();
}

var jwtToken = '';
var errors = 0;

/**
 * Obtains the JWT token needed to post messages to spaces.
 */
function initialize() {
	oauth.run(
		appId,
		appSecret,
		(err, token) => {
			if(err) {
				console.error(`Failed to get JWT token - attempt ${errors}`);
				errors++;
				if(errors > 10) {
					console.error(`Too many JWT token attempts; giving up`);
					return;
				}
				setTimeout(initialize, 10000);
				return;
			}

			console.log("Initialized JWT token");
			jwtToken = token();
		});
}

/**
 * Posts a message to a space.
 */
function respond(text, spaceId, callback) {
	var url = `https://api.watsonwork.ibm.com/v1/spaces/${spaceId}/messages`;
	var body = {
		headers: {
			Authorization: `Bearer ${jwtToken}`
		},
		json: true,
		body: {
			type: 'appMessage',
			version: 1.0,
			annotations: [{
					type: 'generic',
					version: 1.0,
					color: '#6CB7FB',
					text: text,
			}]
		}
	};

	console.log('Responding to ' + url + ' with ' + JSON.stringify(body));

	request.post(url, body, (err, res) => {
		if (err || res.statusCode !== 201) {
			console.error(`Error sending message to ${spaceId} ${err}`);
			callback(err);
			return;
		}
		callback(null, res.body);
	});
}
