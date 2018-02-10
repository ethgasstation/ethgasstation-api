const RedisHelper = require('../../lib/helpers/redis');
const JSONMapper  = require('../../lib/JsonMapper');

class CachingRedisBackedController {

    constructor() {
        // keep an in-memory cache for a cacheKey for a limited
        // amount of time. This will stop us from hammering the store
        // with the same query when it's unlikely to be updated.
        this.EXPIRY_TIME_SEC = 10;
        this.JSONMapper = new JSONMapper();
        this.cachedObjects = {};
    }

    _sendData (redisKey, keyMapping, keyMapName, req, res) {
        try {
            this._getMappedData(redisKey, keyMapping, keyMapName, 
                (result) => {
                    res.json(result);
                });

        }
        catch (e) {
            console.error(e);
            res.status(500).json({
                'success': false,
                'msg': 'Could not parse JSON returned from database'
            })
        }
    }

    _getMappedData (redisKey, keyMapping, keyMapName, cb) {
        this._getCachedData(redisKey,
            (cacheData) => {
                let results = JSON.parse(cacheData.data);
                let forceArrayed = false;
                if (!Array.isArray(results)) {
                    forceArrayed = true;
                    results = new Array(results);
                }
                let resultMap = results.map((result) => {
                    return this.JSONMapper.mapKeys(keyMapping, result)
                });
                let ret = { 'success': true };
                if (forceArrayed) {
                    resultMap = resultMap[0];
                }
                ret[keyMapName] = resultMap;
                cb(ret);
            });
    }

    _getCachedData (redisKey, cb) {
        let cachehit = false;
        if (this.cachedObjects && this.cachedObjects[redisKey]) {
            let now = new Date().getTime();
            let cacheTime = this.cachedObjects[redisKey]['cacheTime'];
            let expired = (cacheTime + (this.EXPIRY_TIME_SEC * 1000)) <= now;
            if (!expired) {
                cachehit = true;
                cb(this.cachedObjects[redisKey]);
            }
        }
        if (cachehit === false) {
            let self = this;
            let redisClient = this._getRedisClient();
            if (redisClient === false) {
                throw new Error("Cannot connect to Redis");
            }
            redisClient.get(redisKey, (err, result) => {
                if (err) {
                    // problems.
                    throw Error("Redis failed to return valid data for key " + redisKey);
                } else {
                    self.cachedObjects[redisKey] = {
                        'data': result,
                        'cacheTime': new Date().getTime()
                    };
                    cb(self.cachedObjects[redisKey]);
                }
            });
        }
    }

    _getRedisClient () {
        try {
            let conn = RedisHelper.getRedisClient();
            return conn;
        }
        catch (e) {
            console.error("Redis error");
            console.error(e);
            return false;
        }
    }

}

module.exports = CachingRedisBackedController;