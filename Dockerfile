# ethgasstation-api Dockerfile
FROM ubuntu:xenial

ENV NODE_ENV production
ENV PORT 8080
ENV DEBIAN_FRONTEND noninteractive

RUN apt-get update
RUN apt-get upgrade -y
RUN apt-get install -y curl
RUN curl -sL https://deb.nodesource.com/setup_9.x | bash -
RUN apt-get install -y nodejs

RUN mkdir -p /opt/ethgasstation/api

COPY controllers/ /opt/ethgasstation/api/controllers
COPY lib/ /opt/ethgasstation/api/lib
COPY app.js /opt/ethgasstation/api/app.js
COPY package.json /opt/ethgasstation/api/package.json
COPY package-lock.json /opt/ethgasstation/api/package-lock.json
COPY conf/ /opt/ethgastation/api/conf
COPY settings.docker.conf /etc/ethgasstation.conf

RUN cd /opt/ethgasstation/api && npm install

EXPOSE 8080
CMD node /opt/ethgasstation/api/app.js