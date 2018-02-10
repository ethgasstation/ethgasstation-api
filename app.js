require('dotenv').config();

const fs              = require('fs');
const glob            = require('glob');
const cluster         = require('cluster');
const redis           = require('redis');

process.env.EGS_APP_ROOT = __dirname;

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
    const cors            = require('cors');
    const http            = require('http');
    const path            = require('path');
    const app             = express();
    const helmet          = require('helmet');

    // preload INI into RAM on bootstrap/fork, everything needs it
    // and we want to avoid synchronous processes in the request pipeline
    const settings        = require('./lib/EGSSettings');
    const limiter         = require('./lib/RateLimiter');


    app.set('port', process.env.PORT || 8080);
    // disable helmet, as these are being set upstream
    // app.use(helmet());
    app.disable('x-powered-by');
    app.use(cors());
    app.use(bodyParser.json());

    // configure rate limiting
    if (process.env.NO_RATE_LIMIT ||
        settings.getSetting('api', 'rate_limit_disable') === true) {
        console.warn("EXPLICIT SECURITY BYPASS: Rate limiting security disabled");
    } else {
        if (settings.getSetting('api', 'behind_reverse_proxy') === true) {
            app.enable('trust proxy');
        }
        app.use(limiter);
    }


    let controller_path = path.join(__dirname, 'controllers');
    let folders = glob.sync(path.join(controller_path, '**/'));
    folders = folders.slice(1,);
    folders.forEach((version_folder) => {
        let split = version_folder.split(path.sep);
        let version = split[split.length - 2];
        if (version === 'base') {
            return;
        }
        console.info("Loading controllers for API version " + version + "...");
        fs.readdirSync(version_folder).forEach((jsfile) => {
            let router = express.Router();
            if (jsfile.substr(-3) === '.js') {
                let controller_path = path.join(version_folder, jsfile);
                console.info("   > " + path.basename(controller_path));
                let controller = require(controller_path);
                controller(router);
            }
            app.use('/' + version, router);
        });
    });
    console.info("Controllers loaded.\n");


    app.get('/', (req, res) => {
        res.json({
            success: true,
            message: 'EthGasStation API OK'
        });
    })

    // default 404 handler
    app.use((req, res, next) => {
        res.status(404).json({
            'success': false,
            'message': 'The requested endpoint does not exist.'
        });
    });

    http.createServer(app).listen(app.get('port'), () => {
        console.log('Express worker process ' + cluster.worker.id + ' listening on ' + app.get('port'));
    });
}
