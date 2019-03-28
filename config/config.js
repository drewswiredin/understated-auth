module.exports = {
  mongoDb : {
    host : 'localhost',
    port : '27017', 
    db : 'understated-auth',
  }, 
  redisDb : {
    host : 'localhost',
    port : '6379', 
    db : '0',
    retry_strategy : 
      function (options) {
        if (options.error && options.error.code === 'ECONNREFUSED') {
            // End reconnecting on a specific error and flush all commands with 
            // a individual error 
            return new Error('The server refused the connection');
        }
        if (options.total_retry_time > 1000 * 60 * 60) {
            // End reconnecting after a specific timeout and flush all commands 
            // with a individual error 
            return new Error('Retry time exhausted');
        }
        if (options.attempt > 10) {
            // End reconnecting with built in error 
            return undefined;
        }
        // reconnect after 
        return Math.min(options.attempt * 100, 3000);
    }
  },
  jwt : {
    secret : '5upermaN!@#',
    session : {
      session : false,
    },
    auth_token_ttl: '+5m',
    refresh_token_ttl: '+2w',
  },
}