/**
 * Vercel serverless function entry (auto-detected from /api).
 *
 * Statically requires the compiled NestJS handler from `npm run build`
 * (dist/src/serverless.js). The `vercel-build` script guarantees dist/
 * exists before Vercel packages this function. Because the require is
 * static, Vercel's bundler traces the entire compiled app into the function.
 */
const handler = require('../dist/src/serverless.js').default;

module.exports = async function mexpoServerless(req, res) {
  return handler(req, res);
};
