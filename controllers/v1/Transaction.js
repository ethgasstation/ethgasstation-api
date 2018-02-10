let CachingRedisBackedController = require('../base/CachingRedisBackedController');

class TransactionController extends CachingRedisBackedController {

    // /v1/tx
    getTransactionStatistics (req, res) {
        this._sendData(
            '_ethgasAPI',
            [
                ['blockNum', 'block_number'],
                ['block_time', 'block_time']
            ],
            'statistics',
            req, res
        );
    }


    // /v1/tx/rates
    getRates (req, res) {
        try {
            this._getCachedData('_ethgasAPI',
                (cacheData) => {
                    let results = JSON.parse(cacheData.data);
                    let ret = {
                        'success': true,
                        'slow': {
                            'wait': results.safeLowWait || null,
                            'price': this._toGwei(results.safeLow) || null
                        },
                        'standard': {
                            'wait': results.avgWait || null,
                            'price': this._toGwei(results.average) || null,
                        },
                        'fast': {
                            'wait': results.fastWait || null,
                            'price': this._toGwei(results.fast) || null
                        },
                        'fastest': {
                            'wait': results.fastestWait || null,
                            'price': this._toGwei(results.fastest) || null
                        }
                    };
                    res.json(ret)
                });
        }
        catch(e) {
            console.error("Error from cached data");
            res.status(500).json({
                'success': false,
                'message': 'Could not retrieve price data.'
            });
        }
    }

    // /v1/tx/rate/:minutes
    getRateForTime (req, res) {
        let minutes = parseFloat(req.params.minutes);
        if (isNaN(minutes)) {
            res.status(401).json({
                'success': false,
                'message': "Bad minute value. Please specify an integer in minutes."
            });
            return;
        }
        try {
            this._getCachedData('_predictTable',
                (cacheData) => {
                    let data = JSON.parse(cacheData.data);
                    console.log(data);
                    if (Array.isArray(data) && data.length) {
                        let target = minutes;
                        let fastestCandidate = null;
                        let candidates = [];

                        // pull everything that meets time target into candidates
                        // while less efficient, this gives the ability to show price ranges
                        for (let i=0; i < data.length; i++) {
                            // get a fallback (fastest) candidate in case we can't meet time target
                            if (data[i].expectedTime) {
                                if (fastestCandidate === null ||
                                    (data[i].expectedTime < fastestCandidate.expectedTime)) {
                                        fastestCandidate = data[i];
                                }
                            }
                            if (data[i].expectedTime && data[i].expectedTime <= target) {
                                candidates.push(data[i]);
                            }
                        }
                        if (candidates.length) {
                            // Array.sort is O(n*log(n)) on n_max = 109
                            candidates = candidates.sort((a, b) => {
                                if (a.gasprice < b.gasprice) {
                                    return -1;
                                }
                                else if (a.gasprice > b.gasprice) {
                                    return 1;
                                }
                                else {
                                    return 0;
                                }
                            });
                            let bestCandidate = candidates[0];
                            res.json({
                                'success': true,
                                'rates': {
                                    'wait': bestCandidate.expectedWait,
                                    'price': bestCandidate.gasprice
                                }
                            });
                        } else {
                            res.status(404).json({
                                'success': false,
                                'message': 'Cannot meet requested wait time. Closest price attached.',
                                'rates': {
                                    'wait': fastestCandidate.expectedWait,
                                    'price': fastestCandidate.gasprice
                                }
                            });
                        }
                    }
                    else {
                        console.error("Invalid data found in prediction table cache");
                        res.status(503).json({
                            'success': false,
                            'message': 'Invalid data in prediction table.'
                        });
                    }
                });
        }
        catch (e) {
            res.status(500).json({
                'success': false,
                'message': 'Could not get data from prediction table.'
            });
        }
    }


    // /v1/tx/predictionTable
    getPredictionTable (req, res) {
        this._sendData(
            '_predictTable',
            [
                ['gasprice', 'price'],
                ['hashpower_accepting', 'hashpower_accepting'],
                ['tx_atabove', 'tx_at_or_above'],
                ['pct_mined_5m', 'pct_mined_5m_ago'],
                ['pct_mined_30m', 'pct_mined_30m_ago'],
                ['total_seen_30m', 'total_seen_30m_ago'],
                ['total_seen_5m', 'total_seen_5m_ago'],
                ['expectedWait', 'expected_wait'],
                ['expectedTime', 'expected_time']
            ],
            'prediction_table',
            req, res
        );
    }

    // /v1/tx/low
    getLowPrices (req, res) {
        this._sendData(
            '_validated',
            [
                ['gasprice', 'price'],
                ['index', 'id'],
                ['mined', 'mined'],
                ['block_mined', 'in_block', 'to_int'],
                ['block_posted', 'posted_at_block', 'to_int']
            ],
            'tx',
            req, res
        );
    }


    // convenience function to change API from 10gwei to gwei.
    _toGwei (price) {
        price = parseFloat(price);
        if (isNaN(price)) return false;
        return parseFloat(price) / 10.0;
    }

}

module.exports = (route) => {
    var controller = new TransactionController();
    route.get('/tx', controller.getTransactionStatistics.bind(controller));
    route.get('/tx/predictionTable', controller.getPredictionTable.bind(controller));
    route.get('/tx/rates', controller.getRates.bind(controller));
    route.get('/tx/rate/:minutes', controller.getRateForTime.bind(controller));
    route.get('/tx/low', controller.getLowPrices.bind(controller));
}