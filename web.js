// web.js

var express = require('express');
var logfmt  = require('logfmt');
var request = require('request');
var OAuth   = require('oauth').OAuth;
var apiVars = require('./lib/APIcredentials');
var fs      = require('fs');
var _       = require('lodash');

var STORE   = {};

//// init Express ////
var app = express();
app.use(logfmt.requestLogger());

//// Oauth ////
var oa = new OAuth(
  'https://bitbucket.org/api/1.0/oauth/request_token',
  'https://bitbucket.org/api/1.0/oauth/access_token',
  apiVars.KEY,
  apiVars.SECRET,
  '1.0',
  'http://localhost:5000/oauth/callback',
  'HMAC-SHA1'
);

//// routes ////
app.get('/', rootPath);
app.get('/oauth/callback', oauthCallbackPath);
app.get('/STORE', storePath);


function rootPath(req, res) {
  oa.getOAuthRequestToken(function(error, oauth_token, oauth_token_secret, results) {
    if (error) {
      res.send(error);
    } else {
      STORE.oauth_token = oauth_token;
      STORE.oauth_token_secret = oauth_token_secret;

      res.redirect('https://bitbucket.org/api/1.0/oauth/authenticate?oauth_token=' + oauth_token);
    }
  });
}

function oauthCallbackPath(req, res) {
  STORE.oauth_verifier = req.query.oauth_verifier;
  var accessTokenCallback = function(error, access_token, access_token_secret, results) {
    if (error) {
      console.log(error);
      STORE = {};
      res.redirect('/');
    } else {
      STORE.access_token = access_token;
      STORE.access_token_secret = access_token_secret;
      // TODO: build it so users can use their own api keys and enter their team name
      // We can now use oa.get, oa.post and more to get the authenticated json
      oa.get('https://bitbucket.org/api/2.0/repositories/Poetic', access_token, access_token_secret, function(err, data) {
        if (err) {
          console.log(err);
          res.redirect('/');
        } else {
          //res.send(data);
          STORE.data = JSON.parse(data);
          //res.redirect('/index.html')
          fs.readFile('./public/index.html', function(err, data) {
            if (err) {
              console.log(err);
              res.end('Server Error');
            } else {
              var html = build_html(data);
              html = html.replace('%', html);
              res.send(html);
            }
          });
        }
      });
    }
  };
  oa.getOAuthAccessToken(
    STORE.oauth_token,
    STORE.oauth_token_secret,
    STORE.oauth_verifier,
    accessTokenCallback
  );
}

function storePath(req, res) {
  res.send(JSON.stringify(STORE));
}

// build html index //
function build_html(data) {
  var tmpl = data.toString();
  var titles = _.pluck(STORE.data.values, 'full_name');
  var descriptions = _.pluck(STORE.data.values, 'description');
  var html = ''
  for (var i = 0; i < titles.length; i++) {
    html += '<h4>' + titles[i] + '</h4>';
    html += '<p>' + descriptions[i] + '</p>';
  }
  return html
}

//// listen port ////
var port = Number(process.env.PORT || 5000);
app.listen(port, function() {
  console.log('Listening on ' + port);
});
