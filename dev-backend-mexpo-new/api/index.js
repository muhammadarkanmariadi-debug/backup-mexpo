/**
 * Vercel serverless function entry (auto-detected from /api).
 *
 * Vercel packages this file with @vercel/node. It statically requires the
 * compiled NestJS handler produced by `npm run build` -> dist/src/serverless.js.
 * The `vercel-build` script guarantees dist/ exists before Vercel bundles
 * this function.
 *
 * Because the require is static, Vercel's bundler traces and includes the
 * entire dist/ output (NestJS modules, runtime deps) in the function package.
 */
const handler = require('../dist/src/serverless.js').default;

module.exports = async function mexpoServerless(req, res) {
  return handler(req, res);
};