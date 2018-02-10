/**
 * Rate Limiting Bootstrapper
 */
const limiter         = require('express-rate-limit');
const limiterRedisStore = require('rate-limit-redis');

const settings        = require('./EGSSettings');
const redis_helper    = require('./helpers/redis');

// TODO: this code could use a refactor/cleanup now that it is in its own file
var bootstrapLimiter = function() {

    // initialize rate limiting
    // we need redis to rate limit across processes.
    // attempt to talk to redis first, before initializing.
    // otherwise we will fall back to per-process rate limiting
    let redisClient = null;
    let redisDisabled = true;
    let APIRateLimiter = null;
    let limiterOptions = {};
    try {
        let redisClient = redis_helper.getRedisClient();
        limiterOptions = {
            store: new limiterRedisStore({
                client: redisClient
            }),
            max: settings.getSetting('api', 'rate_limit_max_requests'),
            windowMs: parseInt(settings.getSetting('api', 'rate_limit_request_window_seconds')) * 1000,
            delayMs: 0
        };
    }
    catch (e) {
        console.warn("Bad Redis config or Redis not available. Disabling Redis-backed rate limiting.");
        limiterOptions = {
            max: settings.getSetting('api', 'rate_limit_max_requests'),
            windowMs: parseInt(settings.getSetting('api', 'rate_limit_request_window_seconds')) * 1000,
            delayMs: 0
        };
    }

    // add proper keying for proxy
    if (settings.getSetting('api', 'behind_reverse_proxy') === true) {
        limiterOptions['key'] = (req) => {
            try {
                let real_ip_header = settings.getSetting('api', 'proxy_real_ip_header');
                let real_header_value = req.header(real_ip_header);
                if (real_header_value) {
                    return real_header_value;
                } else {
                    console.warn("RateLimiter: IP header " + real_ip_header + " isn't set for some reason.");
                    return req.ip;
                }
            }
            catch (e) {
                return req.ip;
            }
        }
    }

    return new limiter(limiterOptions);
};

module.exports = bootstrapLimiter();