require('dotenv').config();

const fs              = require('fs');
const cluster         = require('cluster');
const redis           = require('redis');

if (cluster.isMaster) {
    let processes = require('os').cpus().length;
    if (process.env.WORKER_PROCESSES) {
        processes = parseInt(process.env.WORKER_PROCESSES);
    }
    console.log("Spawning " + processes + " worker processes...");
    for (let i = 0; i < processes; i += 1) {
        cluster.fork();
    }
    // TODO: Consider making master process a worker
} else {
    const express         = require('express');
    const bodyParser      = require('body-parser');
    const http            = require('http');
    const path            = require('path');
    const app             = express();
    const helmet          = require('helmet');
    const limiter         = require('express-rate-limit');
    const limiterRedisStore = require('rate-limit-redis');

    // preload INI into RAM on bootstrap/fork, everything needs it
    // and we want to avoid synchronous processes in the request pipeline
    const settings        = require('./lib/EGSSettings');
    settings.loadSettings();

    app.set('port', process.env.PORT || 8080);
    app.use(helmet());
    app.use(bodyParser.json());

    // initialize rate limiting
    // we need redis to rate limit across processes.
    // attempt to talk to redis first, before initializing.
    // otherwise we will fall back to per-process rate limiting
    let redisClient = null;
    let redisDisabled = true;
    let APIRateLimiter = null;
    try {
        let redisProtocol = settings.getSetting('redis', 'protocol');
        if (settings.getSetting('redis', 'protocol') === 'redis') {
            // XXX abstract to helper
            let connString = 'redis://';
            try {
                let password = settings.getSetting('password');
                connString += ':' + password + '@';
            }
            catch(e) {
                console.warn("Redis password not set. Not authenticating.");
            }
            connString += settings.getSetting('redis', 'hostname');
            try {
                let port = settings.getSetting('redis', 'port');
                connString += ':' + port;
            }
            catch(e) {
                console.warn("Redis port not set. Defaulting to 6379");
                connString += ':6379/';
            }
            console.warn("Redis at " + connString);
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
        APIRateLimiter = new limiter({
            store: new limiterRedisStore({
                client: redisClient
            }),
            max: 120,
            windowMs: 60000,
            delayMs: 0
        });
    }
    catch (e) {
        console.warn("Bad Redis config or Redis not available. Disabling Redis-backed rate limiting.");
        console.warn(e);
        APIRateLimiter = new limiter({
            max: 120,
            windowMs: 60000,
            delayMs: 0
        });
    }
    // add benchmarking exception
    if (process.env.NO_RATE_LIMIT) {
        console.warn("EXPLICIT SECURITY BYPASS: Rate limiting security disabled");
    } else {
        app.use(APIRateLimiter);
    }

    // v0/legacy routes
    // XXX abstract
    let v0_controllers_path = path.join(__dirname, 'controllers', 'v0');
    fs.readdirSync(v0_controllers_path).forEach((jsfile) => {
        let router = express.Router();
        if (jsfile.substr(-3) === '.js') {
            let controller = require('./controllers/v0/' + jsfile);
            controller(router);
        }
        app.use('/v0', router);
    });

    app.get('/', (req, res) => {
        res.json({
            result: 'success'
        });
    })

    http.createServer(app).listen(app.get('port'), () => {
        console.log('Express worker process ' + cluster.worker.id + ' listening on ' + app.get('port'));
    });
}
