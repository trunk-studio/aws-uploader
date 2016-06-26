import Router from 'koa-router';
import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';

var aws = require('aws-sdk');
var crypto = require("crypto");

export default class Routes {

  constructor (app, passport) {
    var router = new Router();
    this.router = router;
    this.app = app;
    // this.authController = new AuthController(passport);
    // this.couponController = new CouponController();
    this.passport = passport;
  }

  setupPublicRoute() {
    var app = this.app;
    var publicRoute = new Router();

    publicRoute.get('/', function(ctx){
      //ctx.redirect('/s3/upload');
      ctx.render('index', {});
    });
    
    publicRoute.get('/video', function(ctx){
      ctx.render('video', {accessKey: appConfig.accessKey});
    });
    
    publicRoute.post('/lambda/:operation', async (ctx) => {
      try {
        let {operation} = ctx.params;
        let res = await fetch(appConfig.lambdaApiEndpoint, { method: 'POST', body: JSON.stringify({operation, payload: ctx.request.body })});
        ctx.body = await res.json();
      }
      catch (e) {
        ctx.body = { error: e };
      }
    });

    app.use(publicRoute.middleware())

    // app.use(function(ctx, next) {
    //   if (ctx.isAuthenticated()) {
    //     return next()
    //   } else {
    //     ctx.redirect('/')
    //   }
    // })

    // app.use(route.get('/app', function(ctx) {
    //
    // }))

  }

  setupAppRoute() {
    this.app.use(this.router.middleware())
  }
}
