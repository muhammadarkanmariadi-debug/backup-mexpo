/**
 * Vercel serverless function entry (auto-detected from /api).
 *
 * Statically requires the compiled NestJS handler from `npm run build`
 * (dist/src/serverless.js). The `vercel-build` script guarantees dist/
 * exists before Vercel packages this function.
 *
 * DIAGNOSTIC: the require is wrapped so that if module-load fails inside
 * Vercel's bundle (missing optional dep, bundler artifact, etc.), the request
 * returns a readable 500 with the exact error message instead of Vercel's
 * generic "Serverless Function has crashed" (FUNCTION_INVOCATION_FAILED).
 */
let handler = null;
let loadError = null;

try {
  handler = require('../dist/src/serverless.js').default;
} catch (err) {
  loadError = err;
  console.error('[api] Failed to load serverless handler:', err);
}

process.on('uncaughtException', (err) => {
  console.error('[api] Uncaught exception:', err);
});

module.exports = async function mexpoServerless(req, res) {
  if (loadError) {
    res.statusCode = 500;
    res.setHeader('content-type', 'application/json');
    res.end(
      JSON.stringify({
        status: false,
        message: 'Handler load failed: ' + (loadError.message || String(loadError)),
      }),
    );
    return;
  }
  return handler(req, res);
};
