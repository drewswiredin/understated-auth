var express = require('express');
var router = express.Router();
var User = require('../../../models/user');
var passport = require('passport');
passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
require('passport-jwt');
require('../../../auth/jwt_auth')(passport);
var jwtConfig = require('../../../config/config').jwt;

// Get user
router.get('/', passport.authenticate('jwt', jwtConfig.session), function(req, res, next) {
  User.findById(req.user.user_id, function(err, result) {
    if (err) return next(err);

    if (result) {
      res.status(200).json(result);
    } else {
      res.status(204).send();
    }
  })
})

// Register new user
router.post('/registration', function(req, res, next) {

  User.register(req.body, req.body.password, function(err, user) {
    if (err) {
      if (err.name == 'UserExistsError') {
        res.send(409);
      } 
      else if (err.name == 'MissingPasswordError') {
          res.send(400, 'Missing Password');
      }
      else if (err.name == 'MissingUsernameError') {
        res.send(400, 'Missing Username');
    }
      else {
        return next(err);
      }
    }

    res.status(201).json(user);
  })
})

module.exports = router;