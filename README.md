# ethgasstation-api
#### A REST-ish API for ethgasstation data.

This API is an Express-based middleware layer for the [ethgasstation
oracle](https://github.com/ethgasstation/ethgasstation-adaptive-oracle).

You can view 10a7's working copy tracking master/unstable at
[gasstation.etheria.io](https://gasstation.etheria.io/api/). **Do not rely
on this endpoint for production usage, as it _will_ break.** For the stable
and canonical ETH Gas Station implementation, always visit
[ethgasstation.info](https://ethgasstation.info/).


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

## Configuration

The primary way to configure the API is with the *settings.conf* file. You may see
the default settings file at *settings.docker.conf*, which is used by the
docker pipeline.

Specific options may also be overridden by environment variables. These are:

* `PORT`: The port the server runs on (default 8080)
* `WORKER_PROCESSES`: Number of worker processes to spawn
* `SETTINGS_FILE`: Path to a settings.conf file
* `NODE_ENV`: The Node environment variable
* `NO_RATE_LIMIT`: Disables rate limiting if set


## Usage

API Documentation for the v1 API is in `docs/v1.md`. v0 API was an original
proof of concept and will be deprecated, as the current ETH Gas Station backend
no longer produces JSON files by default.

