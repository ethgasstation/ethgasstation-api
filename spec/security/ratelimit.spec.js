const settings = require('../../lib/EGSSettings.js');
const request  = require('request');
const childproc = require('child_process');

require('dotenv').config();
settings.loadSettings();
var SERVER_PID = null;

describe("Rate limiting tests", () => {

    // set up rate limiting variables
    // allow positive TEST_MARGIN_OF_ERROR before/after rate limiting to pass
    const TEST_MARGIN_OF_ERROR = 0.25;

    let requestWindow = settings.getSetting('api', 'rate_limit_request_window_seconds') * 1000;
    let requestLimitInWindow = settings.getSetting('api', 'rate_limit_max_requests');
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
    it("rate limits based on settings", (done) => {
        // how many requests should we be able to get through in the window?
        let totalRequestsInWindow = requestLimitInWindow * (1 + TEST_MARGIN_OF_ERROR);
        /**
         * If we aren't redis backed, each process gains a memory store for
         * rate limiting as a fallback. This will end up multiplying possible
         * requests by the number of worker processes.
         */
        if (!shouldBeRedisBacked) {
            totalRequestsInWindow = totalRequestsInWindow * processes;
        }

        let beginTime = new Date().getTime();
        let totalRequests = 0;
        let requestError = false;

        let inflightRequests = [];
        for (let i=0; i < totalRequestsInWindow*1.2; i++) {
            request('http://localhost:8080/',
                { resolveWithFullResponse: true },
                (err, response, body) => {
                    if (err) {
                        fail("Server unavailable");
                        done();
                        return;
                    }

                    totalRequests++;
                    if (parseInt(response.statusCode) === 429) {
                        expect(totalRequests).not.toBeLessThan(requestLimitInWindow * (1 - TEST_MARGIN_OF_ERROR));
                        expect(totalRequests).not.toBeGreaterThan(totalRequestsInWindow);
                        done();
                    }
                    else if(totalRequests > totalRequestsInWindow) {
                        // we are still getting 200s???
                        fail();
                        done();
                    }
                });
        }
    });

});