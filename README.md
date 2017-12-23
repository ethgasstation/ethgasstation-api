# eth-gas-json

Beginnings of an API wrapper around the [ethgasstation.info](https://ethgasstation.info) oracle. Caches the Oracle JSON in memory.

### GET /gas/:key

Returns gas information from the oracle. Possible values for key:

* `safeLow`
* `blockNum`
* `fastestWait`
* `avgWait`
* `fastest`
* `fastWait`
* `average`
* `speed`
* `fast`
* `block_time`
* `safeLowWait`


### GET /priceData/gwei/:gwei

Gives gas station data for the transaction price level set in `:gwei`. For example, to see what to expect at
a gas price of 0.1 gwei, use `GET /priceData/gwei/0.1`.


### Results

Results always contain a JSON `result` key. If this is `error` read the error. If it's `success`, well, you'll have your value.


### License

GNU GPL v3.