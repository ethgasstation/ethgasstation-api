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

    // preload INI into RAM on bootstrap/fork, everything needs it
    // and we want to avoid synchronous processes in the request pipeline
    const settings        = require('./lib/EGSSettings');
    settings.loadSettings();

    const limiter         = require('./lib/RateLimiter.js');

    app.set('port', process.env.PORT || 8080);
    app.use(helmet());
    app.use(bodyParser.json());

    // configure rate limiting
    if (process.env.NO_RATE_LIMIT ||
        settings.getSetting('api', 'rate_limit_disable') === true) {
        console.warn("EXPLICIT SECURITY BYPASS: Rate limiting security disabled");
    } else {
        app.use(limiter);
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
