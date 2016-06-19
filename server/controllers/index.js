import mainController from './main';

import Router from 'koa-router';
import fs from 'fs';
import path from 'path';

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
    var publicRoute = new Router()


    publicRoute.get('/', function(ctx){
      ctx.redirect('/s3/upload');
    });



    publicRoute.get('/s3/upload', function(ctx){
      console.log("=== /s3/upload ===", appConfig.accessKey);
      ctx.render('s3/upload.jade', {accessKey: appConfig.accessKey});
    });


    publicRoute.post('/s3/signature', function(ctx){
      let params = ctx.request.body;
      aws.config.update({accessKeyId: appConfig.accessKey, secretAccessKey: appConfig.secretAccessKey});

      const s3 = new aws.S3();

      const fileName = params.conditions[5]['x-amz-meta-qqfilename'];
      const fileType = params.conditions[2]['Content-Type'];
      let S3_BUCKET = params.conditions[1]['bucket'];

      const s3Params = {
        Bucket: S3_BUCKET,
        Key: fileName,
        Expires: 60,
        ContentType: fileType,
        ACL: 'public-read'
      };

      var policy = new Buffer(JSON.stringify(params)).toString('base64').replace(/\n|\r/, '');
      var hmac = crypto.createHmac("sha1", appConfig.secretAccessKey);

      var hash2 = hmac.update(policy);
      var signature = hmac.digest("base64");

      s3.getSignedUrl('putObject', s3Params, (err, data) => {
        if(err){
          console.log(err);
        }
        const returnData = {
          signedRequest: data,
          url: `https://${S3_BUCKET}.s3.amazonaws.com/${fileName}`,
          "policy": policy,
          "signature": signature
        };
        ctx.body = JSON.stringify(returnData)
      });
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
