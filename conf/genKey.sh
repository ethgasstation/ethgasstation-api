#!/bin/bash

echo "ethgasstation-api: genKey.sh: Generating 2048 bit TLS key"
openssl req \
    -new -newkey rsa:2048 \
    -days 3650 -nodes -x509 \
    -subj "/C=SG/ST=Singapore/L=EthGasStation/O=docker/CN=ethgasstation-api" \
    -keyout ./ssl.key \
    -out ./ssl.crt

if [ -v REGEN_DHPARAMS ]; then
    echo "ethgasstation-api: genKey.sh: Regenerating Diffie-Hellman parameters"
    openssl dhparam -out dhparams 2048
fi

