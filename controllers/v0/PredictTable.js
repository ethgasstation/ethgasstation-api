let HttpJsonCache = require('../../lib/HttpJsonCache');

class PredictTableController {

    getDataForGasPrice (req, res) {
        let gwei = parseFloat(req.params.gwei);
        if (isNaN(gwei) || gwei <= 0) {
            res.status(400).json({ result: 'error', message: 'Bad gwei value.' });
        }

        let data = {};
        new HttpJsonCache().getJSON('https://localhost/json/predictTable.json')
        .then((data) => {
            if (data.length) {
                let prevPrice = 0;
                let newPrice = 0;
                for (let i=0; i < data.length; i++) {
                    if (data[i].gasprice) {
                        if (i > 0) {
                            prevPrice = data[i-1].gasprice;
                        }
                        newPrice = data[i].gasprice;
                        if (prevPrice < gwei && newPrice >= gwei) {
                            res.json({
                                result: 'success',
                                priceData: data[i]
                            });
                            return;
                        }
                    }
                }
            }
            else {
                res.status(503).json({ result: 'error', message: 'EthGasStation returned bad data' });
            }
        })
        .catch((err) => {
            res.status(503).json({ result: 'error', message: 'Cannot fetch from EthGasStation.' });
        });
    }

    getDataForGasMinutes (req, res) {
        let minutes = parseFloat(req.params.minutes);
        if (isNaN(minutes) || minutes <= 0) {
            res.status(400).json({ result: 'error', message: 'Bad minute value.' });
        }

        let data = {};
        new HttpJsonCache().getJSON('https://localhost/json/predictTable.json')
        .then((data) => {
            if (data.length) {
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
                        result: 'success',
                        gasPrice: bestCandidate
                    });
                } else {
                    res.status(404).json({
                        result: 'error',
                        message: 'Cannot meet requested wait time. Closest price attached.',
                        gasPrice: fastestCandidate.gasprice
                    });
                }
            }
            else {
                res.status(503).json({ result: 'error', message: 'EthGasStation returned bad data' });
            }
        })
        .catch((err) => {
            console.log(err);
            res.status(503).json({ result: 'error', message: 'Cannot fetch from EthGasStation.' });
        });
    }

}

module.exports = (route) => {
    var controller = new PredictTableController();
    route.get('/priceData/gwei/:gwei', controller.getDataForGasPrice);
    route.get('/priceData/minutes/:minutes', controller.getDataForGasMinutes);
}

