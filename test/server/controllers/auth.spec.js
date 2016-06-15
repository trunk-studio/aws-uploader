describe('auth', () => {
  describe('sinup', async done => {
    let coupon = {};
    before(async done => {
      try {
        let couponData = {
          serial: 'test',
          class: 'jenkins',
          type: 'normal'
        }
        coupon = await models.Coupon.create(couponData);

        done();

      } catch (e) {
        done(e);
      }
    })
    it('should be add a user', async (done) => {

      try {
        let userData = {
          user: {
            email: 'test@gmail.com',
            password: '123456',
            username: 'test'
          },
          coupon: {
            serial: 'test'
          }
        };
        let result = await request.post("/auth/register/").send(userData);
        result.headers.location.should.be.eq(`/auth/info`);
        result.statusCode.should.be.eq(302);
        done();
      } catch (e) {
        done(e);
      }



    });
  });

  describe.only('local login spec', () => {

    before(async (done) => {

      let testUser = {
        'username': 'test',
        'password': 'test',
        'email': 'test@test.com',
      }
      await models.User.create(testUser);
      done();

    });

    it('do login should be success.', async (done) => {
      let loginUserFormData = {
        'email': 'test@test.com',
        'password': 'test'
      };

      let loginResult = await new Promise((resolve, reject) => {
        request.post('/login/auth')
        .send(loginUserFormData)
        .expect(200)
        .end((error, res) => {

          if (error) return reject(error);
          return resolve(res.body);
        })
      });

      loginResult.success.should.be.true;

      let authResult = await new Promise((resolve, reject) => {
        request.get('/rest/auth/status')
        .expect(200)
        .end((error, res) => {
          if (error) return reject(error);
          return resolve(res.body);
        })
      });

      let sessionUser = authResult.sessionUser;
      let isAuthenticated = authResult.isAuthenticated;

      isAuthenticated.should.be.true;

      try {
        sessionUser.should.be.Object;
        sessionUser.should.have.contain.keys('id', 'username', 'email');
        console.log('=== sessionUser ===', sessionUser);
        done();
      } catch (e) {
        done(e);
      }
    });
  });
});
