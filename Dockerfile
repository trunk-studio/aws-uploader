FROM node:latest

MAINTAINER Kyle "lyhcode@gmail.com"

RUN npm install -g pm2@latest
RUN pm2 install pm2-webshell
RUN pm2 set pm2-webshell:port 9082

EXPOSE 9082
