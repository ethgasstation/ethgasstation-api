# eth-gas-json

Beginnings of an API wrapper around the [ethgasstation.info](https://ethgasstation.info) oracle. Caches the Oracle JSON in memory.

## Installation

To run:

```
npm install
node app.js
```

Better deployment with `docker-compose` comes later.

## Usage

Really simple right now.

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

### GET /priceData/minutes/:minutes

Gets the cheapest gas price to execute the transaction in a predicted amount of time in minutes. If your 
transaction cannot happen as fast as you want, gets the cheapest gas price that will execute as quickly as
possible based upon prediction. For example, to get the cheapest gas price to execute in 20 minutes, use
`GET /priceData/minutes/20`.


### Results

Results always contain a JSON `result` key. If this is `error` read the error. If it's `success`, well, you'll have your value.


## License

GNU GPL v3.