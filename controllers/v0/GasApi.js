let HttpJsonCache = require('../../lib/HttpJsonCache');

class GasApiController {

    getKey (req, res) {
        let data = {};
        new HttpJsonCache().getJSON('https://localhost/json/ethgasAPI.json')
        .then((data) => {
            if (req.params.key in data) {
                let ret = { result: 'success' }
                ret[req.params.key] = data[req.params.key];
                res.json(ret);
            } else {
                res.status(404).json({ result: 'error', message: 'Property not found' });
            }
        })
        .catch((err) => {
            res.status(503).json({ result: 'error', message: 'Cannot fetch from EthGasStation.' });
        });
    }
}

module.exports = (route) => {
    var controller = new GasApiController();
    route.get('/gas/:key', controller.getKey);
}

