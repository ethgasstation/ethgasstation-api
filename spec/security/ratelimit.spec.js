const settings = require('../../lib/EGSSettings.js');
const request  = require('request');

require('dotenv').config();

describe("Rate limiting tests", () => {

    settings.loadSettings();

    // set up rate limiting variables
    // allow +/- TEST_MARGIN_OF_ERROR before/after rate limiting to pass
    const TEST_MARGIN_OF_ERROR = 0.05;

    let requestWindow = 60000;
    let requestLimitInWindow = 120;
    let processes = require('os').cpus().length;
    if (process.env.WORKER_PROCESSES) {
        processes = parseInt(process.env.WORKER_PROCESSES);
    }

    var shouldBeRedisBacked;
    try {
        let protocol = settings.getSetting('redis', 'protocol');
        switch (protocol) {
            case 'redis':
                settings.getSetting('redis', 'hostname');
                shouldBeRedisBacked = true;
                break;
            case 'unix':
                settings.getSetting('redis', 'path');
                shouldBeRedisBacked = true;
                break;
            default:
                break;
        }
    }
    catch (e) {
        shouldBeRedisBacked = false;
    }

    /*
     * While this is cute and works for one environment,
     * the correct way to handle this will be to create
     * multiple configuration file permutations and autoload
     * them into settings via loadSettingsFile.
     */
    it("rate limits properly based on settings", () => {
        // how many requests should we be able to get through in the window?
        let runtimeMilliseconds = requestWindow;
        let totalRequestsInWindow = requestLimitInWindow * TEST_MARGIN_OF_ERROR;

        let beginTime = new Date().getTime();
        for (let i=0; i < totalRequestsInWindow; i++) {
            // put it to the wall, mister laforge
            // TODO
        }
    });

});