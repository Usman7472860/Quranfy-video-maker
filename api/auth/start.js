// GET /api/auth/start?p=facebook|tiktok&n=<app nonce>&m=upload|publish
// Opened in the phone's browser by the app. Redirects to the provider's consent screen.
const { seal, redirectUri, fbVer, errorPage } = require('../_lib');

module.exports = (req, res) => {
  try {
    const { p, n, m } = req.query;
    const need = p === 'facebook' ? ['FB_APP_ID', 'FB_APP_SECRET', 'PUBLIC_URL', 'SEAL_KEY']
      : p === 'tiktok' ? ['TT_CLIENT_KEY', 'TT_CLIENT_SECRET', 'PUBLIC_URL', 'SEAL_KEY'] : [];
    const missing = need.filter((k) => !process.env[k]);
    if (missing.length) return errorPage(res, 'Vercel mein env variable missing hai: ' + missing.join(', '));
    if (!n || String(n).length < 16) return errorPage(res, 'bad nonce');
    const state = seal({ p, n, m: m || '', t: Date.now() });   // encrypted state = CSRF protection

    let url;
    if (p === 'facebook') {
      const params = {
        client_id: process.env.FB_APP_ID,
        redirect_uri: redirectUri('facebook'),
        state,
        response_type: 'code',
      };
      if (process.env.FB_CONFIG_ID) {
        // "Facebook Login for Business": scope ki jagah Configuration ID (permissions config mein hoti hain)
        params.config_id = process.env.FB_CONFIG_ID;
        params.override_default_response_type = 'true';
      } else {
        params.scope = 'pages_show_list,pages_read_engagement,pages_manage_posts';
      }
      const q = new URLSearchParams(params);
      url = `https://www.facebook.com/${fbVer()}/dialog/oauth?${q}`;
    } else if (p === 'tiktok') {
      const scope = m === 'publish' ? 'user.info.basic,video.publish,video.upload' : 'user.info.basic,video.upload';
      const q = new URLSearchParams({
        client_key: process.env.TT_CLIENT_KEY,
        scope,
        response_type: 'code',
        redirect_uri: redirectUri('tiktok'),
        state,
      });
      url = `https://www.tiktok.com/v2/auth/authorize/?${q}`;
    } else {
      return errorPage(res, 'unknown platform');
    }
    res.redirect(302, url);
  } catch (e) {
    errorPage(res, 'server config error: ' + e.message);
  }
};
