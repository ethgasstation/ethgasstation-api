/**
 * Banhammer
 * IP Blacklisting
 **/

const redis    = require('redis');
const path     = require('path');
const fs       = require('fs');

const settings = require('../EGSSettings');
const redis_helper = require('../helpers/redis');

class Banhammer {

    constructor (options) {
        this.defaults = {
            backingStore: 'redis',
            redisPrefix: 'banhammer_'
        }
        this.options = Object.assign({}, this.defaults, options);
        this.proxyEnabled = (settings.getSetting('api', 'behind_reverse_proxy') === true);
        if (this.proxyEnabled) {
            this.proxyHeader = settings.getSetting('api', 'proxy_real_ip_header');
        }

        switch (this.backingStore) {
            case 'redis':
                this.redis = redis_helper.getRedisClient();
                break;

            case 'fs':
                this.api_key_file = settings.getSetting('api', 'banhammer_api_key_file');
                this.ip_addr_file = settings.getSetting('api', 'banhammer_ip_addr_file');
                if (!fs.existsSync(this.api_key_file)) {
                    console.warn("Banhammer: no API key file found, creating");
                    fs.closeSync(fs.openSync(this.api_key_file, 'w'));
                }
                if (!fs.existsSync(this.ip_addr_file)) {
                    // attempt to create?
                    console.warn("Banhammer: no IP file found, creating");
                    fs.closeSync(fs.openSync(this.ip_addr_file, 'w'));
                }
                break;

            default:
                throw new Error("Unsupported backing store.");
        }
    }

    /**
     * Express.js middleware filter.
     *
     * @param {*} req 
     * @param {*} res 
     * @param {*} next 
     */
    filter (req, res, next) {
        let userIP = this._getClientIP(req);
        if (this._isBannedAddress(userIP)) {
            res.status(401);
            res.json({
                status: 'error',
                msg: 'IP address blocked.'
            });
        } else if (req.api_key &&
            this._isBannedAPIKey(req.api_key)) {
            res.status(401);
            res.json({
                status: 'error',
                msg: 'API key blocked.'
            });
        } else {
            next();
        }
    }

    // TODO: add logging infrastructure.
    // attempts by banned addresses should be logged.
    _isBannedAddress (ip_addr) {
        switch (this.backingStore) {
            case 'redis':
                return this._isBannedRedis(ip_addr);
            case 'fs':
                return this._isBannedAddressFS(ip_addr);
            default:
                throw new Error("Banhammer: Undefined backing store.");
        }
    }

    _isBannedAPIKey (api_key) {
        switch (this.backingStore) {
            case 'redis':
                return this._isBannedRedis(api_key);
            case 'fs':
                return this._isBannedAPIKeyFS(api_key);
            default:
                throw new Error("Banhammer: Undefined backing store.");
        }
    }

    _isBannedAddressFS (ip_addr) {
        return this._existsInFile(this.ip_addr_file, ip_addr);
    }

    _isBannedAPIKeyFS (api_key) {
        return this._existsInFile(this.api_key_file, api_key);
    }

    _existsInFile (filepath, string) {
        let res = fs.readFileSync(filepath, 'utf-8');
        let entries = res.split("\n");
        entries.forEach((possible_match) => {
            if (string === possible_match) {
                return true;
            }
        });
        return false;
    }

    _isBannedRedis (ip_addr_or_api_key) {
        return this.redis.exists(this._getRedisKey(ip_addr_or_api_key)) >= 1;
    }

    _getRedisKey (data) {
        return this.options.redisPrefix + data.toString();
    }

    _getClientIP (req) {
        if (this.proxyEnabled) {
            let ip = req.headers[this.proxyHeader];
            if (ip === '') {
                throw new Error("Banhammer: Cannot filter, proxy header not set by upstream");
            }
            return ip;
        } else {
            return req.ip;
        }
    }

}

module.exports = Banhammer;