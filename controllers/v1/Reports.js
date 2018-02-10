let CachingRedisBackedController = require('../base/CachingRedisBackedController');

class ReportsController extends CachingRedisBackedController {

    // /reports/txSummary
    getTxSummary (req, res) {
        this._sendData(
            '_txDataLast10k',
            [
                ['cheapestTx', 'cheapest_tx_fee'],
                ['cheapestTxID', 'cheapest_tx_id'],
                ['dearestTx', 'expensive_tx_price'],
                ['dearestTxID', 'expensive_tx_id'],
                ['emptyBlocks', 'empty_blocks'],
                ['ETHpriceCNY', 'price_cny'],
                ['ETHpriceUSD', 'price_usd'],
                ['ETHpriceEUR', 'price_eur'],
                ['fullBlocks', 'full_blocks'],
                ['latestblockNum', 'latest_block_number'],
                ['medianDelay', 'median_delay_blocks'],
                ['medianDelayTime', 'median_delay_time_sec'],
                ['maxMinedGasPrice', 'mined_gas_price_max'],
                ['medianGasPrice', 'mined_gas_price_median'],
                ['minMinedGasPrice', 'mined_gas_price_min'],
                ['totalTx', 'total_tx'],
                ['totalCatTx1', 'total_tx_lt1'],
                ['totalCatTx2', 'total_tx_gt1_lte4'],
                ['totalCatTx3', 'total_tx_gt4_lte20'],
                ['totalCatTx4', 'total_tx_gt20_lte50'],
                ['totalCatTx5', 'total_tx_gte50']
            ],
            'report',
            req, res
        );
    }

}

module.exports = (route) => {
    var controller = new ReportsController();
    route.get('/reports/txSummary', controller.getTxSummary.bind(controller));
}