let HttpJsonCache = require('../lib/HttpJsonCache');

class PredictTableController {
    
    constructor() { 

    }

    getDataForGasPrice (req, res) {
        let gwei = parseFloat(req.params.gwei);
        if (isNaN(gwei) || gwei <= 0) {
            res.status(400).json({ result: 'error', message: 'Bad gwei value.' });
        }

        let data = {};
        new HttpJsonCache().getJSON('https://ethgasstation.info/json/predictTable.json')
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

}

module.exports = (route) => {
    var controller = new PredictTableController();
    route.get('/priceData/gwei/:gwei', controller.getDataForGasPrice);
}
  