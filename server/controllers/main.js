exports.hello = async function(ctx) {

  let result = services.main.hello();
  ctx.body = {result};
};
