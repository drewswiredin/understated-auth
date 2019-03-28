// Bring Mongoose into the app 
var mongoose = require( 'mongoose' ); 
mongoose.Promise = global.Promise;
var mongoConfig = require('../config/config').mongoDb;

// Build the connection string 
var dbURI = 'mongodb://' + mongoConfig.host + ':' + mongoConfig.port + '/' + mongoConfig.db;

// Create the database connection 
mongoose.connect(dbURI, { useNewUrlParser: true}); 

// CONNECTION EVENTS
// When successfully connected
mongoose.connection.on('connected', function () {  
  console.log('MongoDb connection established');
}); 

// If the connection throws an error
mongoose.connection.on('error',function (err) {  
  console.log('MongoDb connection error: ' + err);
}); 

// When the connection is disconnected
mongoose.connection.on('disconnected', function () {  
  console.log('MongoDb connection disconnected'); 
});

// If the Node process ends, close the Mongoose connection 
process.on('SIGINT', function() {  
  mongoose.connection.close(function () { 
    console.log('MongoDb connection disconnected through app termination'); 
    process.exit(0); 
  }); 
}); 
