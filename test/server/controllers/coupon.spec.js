
describe("coupon", () => {

  describe("use", done => {
    let coupon = {};
    before(async done => {

      try {
        let couponData = {
          serial: '12345678',
          class: 'jenkins',
          type: 'normal'
        }
        coupon = await models.Coupon.create(couponData);

        done();

      } catch (e) {
        done(e);
      }
    })



    it('should redirect to user register', async done => {
      try {
        let serial = '12345678';
        let result = await request.post("/rest/coupon/use/").send({serial});

        result.headers.location.should.be.eq(`/auth/signup/coupon/${coupon.serial}`);
        result.statusCode.should.be.eq(302);
        done();
      } catch (e) {
        done(e);
      }
    });



  });


});
