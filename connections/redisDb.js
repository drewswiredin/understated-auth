// Bring redis module into the app
var redis = require('redis');
var redisConfig = require('../config/config').redisDb;
redisClient = redis.createClient(redisConfig);

redisClient.on("connect", function () {
  console.log("Redis connection established");
});

redisClient.on("ready", function () {
  console.log("Redis connection is in ready state");
});

redisClient.on("reconnecting", function () {
  console.log("Reconnecting to Redis server");
});
redisClient.on("end", function () {
  console.log("Redis connection has been lost");
});
redisClient.on("", function () {
  console.log("");
});
redisClient.on("", function () {
  console.log("");
});

redisClient.on("error", function (err) {
  console.log("Error " + err);
});

// If the Node process ends, close the Mongoose connection 
process.on('SIGINT', function() {  
  redisClient.quit(function () { 
    console.log('Redis connection disconnected through app termination'); 
    process.exit(0); 
  }); 
}); 

module.exports = redisClient;