/**
 * Various Redis code used in a lot of places.
 */

const redis = require('redis');
const settings = require('../EGSSettings');

var RedisHelpers = {

    getRedisClient: function() {
        let redisProtocol = settings.getSetting('redis', 'protocol');
        if (settings.getSetting('redis', 'protocol') === 'redis') {
            let connString = 'redis://';
            try {
                let password = settings.getSetting('password');
                connString += ':' + password + '@';
            }
            catch(e) {
                console.warn("getRedisClient: Redis password not set. Not authenticating.");
            }
            connString += settings.getSetting('redis', 'hostname');
            try {
                let port = settings.getSetting('redis', 'port');
                connString += ':' + port;
            }
            catch(e) {
                console.warn("getRedisClient: Redis port not set. Defaulting to 6379");
                connString += ':6379';
            }
            console.warn("RateLimiter: Redis at " + connString);
            redisClient = redis.createClient(connString);
        }
        else if (redisProtocol === 'unix') {
            // TODO: finish socket
            redisClient = redis.createClient({
                path: settings.getSetting('redis', 'path')
            });
        } else {
            throw new Error("Bad Redis protocol.");
        }
        return redisClient;
    }

};

module.exports = RedisHelpers;