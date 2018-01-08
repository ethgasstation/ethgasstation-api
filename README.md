# ethgasstation-api
#### A REST-ish API for ethgasstation data.

This API is an Express-based middleware layer for the [ethgasstation
oracle](https://github.com/ethgasstation/ethgasstation-adaptive-oracle).
Currently the API's `/v0/` endpoints are meant to interface with legacy
gas station code; `/v1/` and later will conform more to REST-style
specifications. It should be assumed that running code on `/v0/` will likely
break on official endpoints in the future.

This API is unstable and in active development. It is not officially
supported at this time.

## Installation

To run:

```
npm install
node app.js
```

A Dockerfile is included for deployment as well. To run the Docker image:

```
docker build -t ethgasstation-api .
docker run -p 8080:8080 ethgasstation-api
```

This will expose and forward port 8080 from the image. Note that the docker
image runs in production mode by default.


## Usage

Really simple right now.

### GET /v0/gas/:key

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


### GET /v0/priceData/gwei/:gwei

Gives gas station data for the transaction price level set in `:gwei`. For example, to see what to expect at
a gas price of 0.1 gwei, use `GET /priceData/gwei/0.1`.

### GET /v0/priceData/minutes/:minutes

Gets the cheapest gas price to execute the transaction in a predicted amount of time in minutes. If your 
transaction cannot happen as fast as you want, gets the cheapest gas price that will execute as quickly as
possible based upon prediction. For example, to get the cheapest gas price to execute in 20 minutes, use
`GET /priceData/minutes/20`.


### Results

Results always contain a JSON `result` key. If this is `error` read the error. If it's `success`, well, you'll have your value.
