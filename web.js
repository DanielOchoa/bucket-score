// web.js

var express = require('express');
var logfmt  = require('logfmt');
var request = require('request');
var OAuth   = require('oauth').OAuth;
var apiVars = require('./APIcredentials');
// TODO: change this to it's own module with redis or something
var STORE   = {}

//// init Express ////
var app = express();
app.use(logfmt.requestLogger());

//// Oauth ////
var oa = new OAuth('https://bitbucket.org/api/1.0/oauth/request_token',
    'https://bitbucket.org/api/1.0/oauth/access_token',
    apiVars.KEY,
    apiVars.SECRET,
    '1.0',
    'http://localhost:5000/oauth/callback',
    'HMAC-SHA1');

//// routes ////
app.get('/', function(req, res) {
  oa.getOAuthRequestToken(function(error, oauth_token, oauth_token_secret, results) {
    if (error) {
      res.send(error);
    } else {
      STORE.oauth_token = oauth_token;
      STORE.oauth_token_secret = oauth_token_secret;

      res.redirect('https://bitbucket.org/api/1.0/oauth/authenticate?oauth_token=' + oauth_token);
    }
  });
});

app.get('/oauth/callback', function(req, res) {
  STORE.oauth_verifier = req.query.oauth_verifier;
  var accessTokenCallback = function(error, access_token, access_token_secret, results) {
    if (error) {
      res.send(error);
    } else {
      STORE.access_token = access_token;
      STORE.access_token_secret = access_token_secret;
      // TODO: build it so users can use their own api keys and enter their team name
      // We can now use oa.get, oa.post and more to get the authenticated json
      oa.get('https://bitbucket.org/api/2.0/repositories/Poetic', access_token, access_token_secret, function(err, data) {
        if (err) {
          res.send(errj);
        } else {
          res.send(data);
        }
      });
    }
  };

  oa.getOAuthAccessToken(STORE.oauth_token, STORE.oauth_token_secret, STORE.oauth_verifier, accessTokenCallback);
});

//// listen port ////
var port = Number(process.env.PORT || 5000);
app.listen(port, function() {
  console.log('Listening on ' + port);
});
