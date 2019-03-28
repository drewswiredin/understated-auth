var express = require('express');
var router = express.Router();
var User = require('../../../models/user');
var jwt = require('jwt-simple');
var jwtConfig = require('../../../config/config').jwt;
var timestamp = require('unix-timestamp');
var guid = require('guid');
var passport = require('passport');
passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
require('passport-jwt');
require('../../../auth/jwt_auth')(passport);


// Authenticate user
router.post('/access', function(req, res, next) {
  var authenticate = User.authenticate();
  authenticate(req.body.email, req.body.password, function(err, result) {
    if (err) return next(err);

    if (result) {
      User.findByUsername(req.body.email, function(err, account) {
        if (err) return next(err);

        // Create an id to associate the auth token to it's refresh token
        var refresh_id = guid.create();

        var refreshTokenExp = timestamp.now(jwtConfig.refresh_token_ttl);
        var tokenPackage = {
          access: jwt.encode(
            {
              token_id: guid.create(),
              user_id: account.id,
              user_version: account.__v,
              iat: timestamp.now(),
              xat: timestamp.now(jwtConfig.auth_token_ttl),
              is_refresh: false,
              refresh_id: refresh_id, 
              refresh_xat: refreshTokenExp,
            }
            , jwtConfig.secret
          ),
          refresh: jwt.encode(
            {
              token_id: refresh_id,
              user_id: account.id,
              user_version: account.__v,
              iat: timestamp.now(),
              xat: refreshTokenExp,
              is_refresh: true,
              refresh_id: null,
              refresh_xat: null,
            }
            , jwtConfig.secret
          ),
        }

        res.json({success: true, tokens: tokenPackage});
      })
    } else {
      res.send(401);
    }
  });
})


// Issue new token if using valid refresh token
router.get('/refresh', passport.authenticate('jwt', jwtConfig.session), function(req, res, next) {
  // Since this route is authenticated against a token we know that it's valid
  // go ahead and create a new auth token and send back to client
  // but if the token sent wasn't a refresh token then send back the passed in token unchanged
  var tokenPackage = {
    access: jwt.encode(
      {
        token_id: (req.user.is_refresh) ? guid.create() : req.user.token_id,
        user_id: req.user.user_id,
        user_version: req.user.user_version,
        iat: (req.user.is_refresh) ? timestamp.now() : req.user.iat,
        xat: (req.user.is_refresh) ? timestamp.now(jwtConfig.auth_token_ttl) : req.user.xat,
        is_refresh: false,
        refresh_id: (req.user.is_refresh) ?  req.user.token_id : req.user.refresh_id,
        refresh_xat: (req.user.is_refresh) ? req.user.xat : req.user.refresh_xat,
      }
      , jwtConfig.secret
    ),
  }
  res.json({success: true, tokens: tokenPackage});
})


// Log out user and blacklist current tokens associated with the device in use
router.post('/logout', passport.authenticate('jwt', jwtConfig.session), function(req, res, next) {

  var authTokenLifeRemaining = Math.ceil(req.user.xat - timestamp.now());
  var refreshTokenLifeRemaining = Math.ceil(req.user.refresh_xat - timestamp.now());

  if (authTokenLifeRemaining > 0) {
    redisClient.set(req.user.token_id, "revoked", 'EX', authTokenLifeRemaining)
  }

  if (refreshTokenLifeRemaining > 0) {
    redisClient.set(req.user.refresh_id, "revoked", 'EX', refreshTokenLifeRemaining);
  }

  res.send(200, 'OK');
})


// Log out user and blacklist current tokens associated with the device in use
router.post('/logoutglobal', passport.authenticate('jwt', jwtConfig.session), function(req, res, next) {
  User.findById(req.user.user_id, function(err, user) {
    if (err) return next(err);

    user.__v++;
    user.save(function(err) {
      if (err) return next(err);

      var maxRefreshTokenLifeRemaining = Math.ceil(timestamp.now(jwtConfig.refresh_token_ttl) - timestamp.now());

      if (maxRefreshTokenLifeRemaining > 0) {

        redisClient.set(req.user.user_id.toString() + '_v' + req.user.user_version.toString(), "revoked", 'EX', maxRefreshTokenLifeRemaining)
      }

      res.send(200, 'OK');
    })
  })
})


module.exports = router;