/**
 * Cache JSON files from remote HTTP source to memory.
 */

const request = require('request-promise');
const crypto  = require('crypto');

let instance = null;

class HttpJsonCache {

    constructor(opts) {
        if (!instance) {
            instance = this;
            let defaults = {
                expiry: 60 // expiry time in seconds
            };
            this.options = Object.assign({}, defaults, opts);
            this.memcache = {};
        }
        return instance;
    }

    async getJSON (file_uri) {
        let key = this._hashKey(file_uri);

        return new Promise((resolve, reject) => {
            if (key in this.memcache) {
                // cache hit
                if (!this._isExpired(this.memcache[key])) {
                    // still valid
                    resolve(this.memcache[key].data);
                    return;
                }
            }

            // cache miss
            let result = null;
            let attempts = 0;
            request.get({
                uri: file_uri,
                headers: {
                    'User-Agent': 'EthGasStationAPI/0.1'
                },
                json: true
            })
            .then((data) => {
                result = data;
                if (typeof result !== 'object') {
                    reject('bad-data');
                }
                this.memcache[key] = this._makeFileObject(result);
                resolve(result);
            })
            .catch((err) => {
                attempts += 1;
                if (attempts >= this.options.retries) {
                    reject('too-many-retries');
                }
            });
        });
    }

    _hashKey (str) {
        let h = crypto.createHash('sha256');
        h.update(str);
        return h.digest('hex');
    }

    _isExpired (fileObject) {
        return (fileObject.expirationDate < new Date().getTime());
    }

    _makeFileObject (data, expirationDate) {
        if (typeof expirationDate !== 'number') {
            expirationDate = new Date().getTime() + this.options.expiry * 1000;
        }
        return {
            expirationDate: expirationDate,
            data: data
        }
    }

}

module.exports = HttpJsonCache;
