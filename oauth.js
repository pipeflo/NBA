'use strict';

var request = require('request'),
    jsonwebtoken = require('jsonwebtoken');

// Obtain an OAuth token for the app, repeat at regular intervals before the
// token expires. Returns a function that will always return a current
// valid token.
exports.run = function(appId, secret, cb) {
  let tok;

  // Return the current token
  const current = () => tok;

  // Return the time to live of a token
  const ttl = (tok) =>
    Math.max(0, jsonwebtoken.decode(tok).exp * 1000 - Date.now());

  // Refresh the token
  const refresh = (cb) => {
    console.log('Getting token');
    request.post('https://api.watsonwork.ibm.com/oauth/token', {
      auth: {
        user: appId,
        pass: secret
      },
      json: true,
      form: {
        grant_type: 'client_credentials'
      }
    }, (err, res) => {
      if(err || res.statusCode !== 200) {
        console.log('Error getting token %o', err || res.statusCode);
        cb(err || new Error(res.statusCode), current);
        return;
      }

      // Save the fresh token
      console.log('Got new token');
      tok = res.body.access_token;

      // Schedule next refresh a bit before the token expires
      const t = ttl(tok);
      console.log('Token ttl', t);
      setTimeout(function() { refresh(cb); }, Math.max(0, t - 60000)).unref();

      // Return a function that'll return the current token
      cb(undefined, current);
    });
  };

  // Obtain initial token
  setImmediate(() => refresh(cb));
};
