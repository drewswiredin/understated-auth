var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var passportLocalMongoose = require('passport-local-mongoose');
mongoose.set('useCreateIndex', true)
var UserSchema = new Schema();

UserSchema.plugin(passportLocalMongoose, { usernameField : 'email'}, { versionKey: true });

module.exports = mongoose.model('User', UserSchema);