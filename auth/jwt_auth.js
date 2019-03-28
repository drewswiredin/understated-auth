var JwtStrategy = require('passport-jwt').Strategy;
var ExtractJwt = require('passport-jwt').ExtractJwt;
var User = require('../models/user');
var jwtConfig = require('../config/config').jwt;
var redisClient = require('../connections/redisDb');
var jwtSimple = require('jwt-simple');
var secret = jwtConfig.jwtSecret;
var passportJwt = require('passport-jwt');
var timestamp = require('unix-timestamp');

module.exports = function(passport) {
  var opts = {}
  opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
  opts.secretOrKey = jwtConfig.secret;
  passport.use(new JwtStrategy(opts, function(jwt_payload, done) {
    
    // Check token expiration
    if (jwt_payload.xat < timestamp.now()) return done(null, false, 'Expired Token');

    // Check if token_id is blacklisted
    redisClient.get(jwt_payload.token_id, function(err, reply) {
    if (err) {
      return done(null, false);
    }
    if (reply) {
      return done(null, false);
    } else {
      // Check if user_id + user_version is blacklisted in case of password change
      redisClient.get(jwt_payload.user_id + '_v' + jwt_payload.user_version, function(err, reply) {
        if (err) {
          return done(null, false);
        }
        if (reply) {
          return done(null, false);
        } else {
          return done(null, jwt_payload);
        }
      })
    }
    })
  }));
}