// GET /api/health  → shows which environment variables are set (never shows their values)
module.exports = (req, res) => {
  const names = ['PUBLIC_URL', 'SEAL_KEY', 'FB_APP_ID', 'FB_APP_SECRET', 'TT_CLIENT_KEY', 'TT_CLIENT_SECRET', 'FB_CONFIG_ID'];
  const env = {};
  names.forEach((n) => { env[n] = !!process.env[n]; });
  let sealKeyOk = false;
  try { sealKeyOk = Buffer.from(process.env.SEAL_KEY || '', 'base64').length === 32; } catch (e) {}
  res.setHeader('Cache-Control', 'no-store');
  res.status(200).json({ ok: true, env, sealKeyOk });
};
