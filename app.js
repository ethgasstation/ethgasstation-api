require('dotenv').config();

const fs              = require('fs');
const cluster         = require('cluster');

if (cluster.isMaster) {
    let processes = require('os').cpus().length;
    console.log("Spawning " + processes + " worker processes...");
    for (let i = 0; i < processes; i += 1) {
        cluster.fork();
    };
} else {
    const express         = require('express');
    const bodyParser      = require('body-parser');
    const http            = require('http');
    const path            = require('path');
    const app             = express();
    const helmet          = require('helmet');

    app.set('port', process.env.PORT || 8080);
    app.use(helmet());
    app.use(bodyParser.json());

    fs.readdirSync('./controllers').forEach((jsfile) => {
        if (jsfile.substr(-3) === '.js') {
            let controller = require('./controllers/' + jsfile);
            controller(app);
        }
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