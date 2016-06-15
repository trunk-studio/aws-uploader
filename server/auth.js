
var passport = require('koa-passport')

passport.serializeUser(function(user, done) {
  console.log('=== serializeUser ===');
  done(null, user)
})

passport.deserializeUser(function(id, done) {
  console.log('=== id ===');
  done(null, id)
})

var LocalStrategy = require('passport-local').Strategy
passport.use(new LocalStrategy({
    usernameField: 'email'
  }, async (username, password, done) => {
  let loginInfo = {
    where: {email: username, password}
  };

  console.log('=== loginInfo ===', loginInfo);
  try {
    let logedUser = await models.User.findOne(loginInfo);

    if (logedUser) {
      done(null, logedUser)
    } else {
      done(null, false);
    }
  } catch (e) {
    console.log(e);
    done(null, false);
  }
}));
