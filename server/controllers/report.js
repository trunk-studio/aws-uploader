exports.report = async function (ctx) {
  try {
    const data = ctx.request.body
    console.log(data);
    ctx.body = { status: 'ok' };
  } catch (e) {
    ctx.body = { error: e };
  }
};
