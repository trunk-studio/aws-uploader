import path from 'path';
import debug from 'debug';

import koa from 'koa';
import responseTime from 'koa-response-time';
import logger from 'koa-logger';
import koaBodyParser from 'koa-bodyparser';

import bootstrap from './bootstrap';
import config from './config/init';
import Models from './models';
import Controllers from './controllers';
import Services from './services';

// mount route
import mount from 'koa-mount';
import send from 'koa-send';
import moment from 'moment';
import sinon from 'sinon';
import fs from 'fs-extra';
import staticCache from 'koa-static-cache';
import compress from 'koa-compress';
import convert from 'koa-convert';

import session from 'koa-generic-session';
import passport from 'koa-passport';
import Pug from 'koa-pug';
import cors from 'koa-cors';

global.appConfig = config;

global.moment = moment;
global.sinon = sinon;
global.fs = fs;

const {environment} = appConfig;
const app = new koa();

// do not use this secret for production
const secret = config.secret

app.use(convert(cors()));
app.use(koaBodyParser());

// setup rest models
global.models = (new Models()).getDb();

app.use(convert(responseTime()));
app.use(logger());

// sessions
app.keys = ['your-session-secret']
app.use(convert(session()))

require('./auth')
app.use(convert(passport.initialize()))
app.use(convert(passport.session()))

if (environment === 'production') {
  // set debug environment to `koa` only
  // must be set programmaticaly for windows
  debug.enable('koa,error');
}

if (environment === 'development') {

  // set debug environment, must be programmaticaly for windows
  debug.enable('dev,koa,error');
  // log when process is blocked
  require('blocked')((ms) => debug('koa')(`blocked for ${ms}ms`));

}

new Pug({
  app: app,
  viewPath: path.join(__dirname, 'views'),
  debug: true,
  pretty: true
})

// app.use(jade(path.join(__dirname, 'views'), {debug: true, pretty: true}));


app.use(convert(mount('/public/assets/css', staticCache(path.join(__dirname, '../public/assets/css/'), {maxAge: 30 * 24 * 60 * 60}))));
app.use(convert(mount('/public/assets/js', staticCache(path.join(__dirname, '../public/assets/js/'), {maxAge: 30 * 24 * 60 * 60}))));
app.use(convert(mount('/public/assets/images', staticCache(path.join(__dirname, '../public/assets/images/'), {maxAge: 30 * 24 * 60 * 60}))));
app.use(convert(mount('/public/assets/fineuploader', staticCache(path.join(__dirname, '../public/assets/fineuploader/'), {maxAge: 30 * 24 * 60 * 60}))));
global.services = new Services();
var controllers = new Controllers(app, passport);


app.use(async function (ctx, next) {
  try {
    await next();
  } catch (error) {
    debug('error')(error);
    throw error;
  }
});


controllers.setupPublicRoute()
controllers.setupAppRoute()


var liftApp = async () => {
  try {
    await models.sequelize.sync({force: config.connection.force})

    console.log(config);
    app.listen(config.port);
    await bootstrap();

    if (process.send) process.send('online');
    debug('koa')(`Application started on port ${config.port}`);

  } catch (e) {
      console.log(e.stack);
  }

  return app;

}
if (environment !== 'test') liftApp();

module.exports = liftApp
