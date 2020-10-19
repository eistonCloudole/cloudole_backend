const nonce = require('nonce')();

const apiKey = '3184f521fc3473624d2142ae452aaec6';
const apiSecret = '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';
const scopes = 'read_products';
const forwardingAddress = "https://us-central1-cloudole-2f23d.cloudfunctions.net/api";

exports.shopifyLogin = (req, res) => {
    const shop = req.query.shop;
    if (shop) {
      const state = nonce();
      const redirectUri = forwardingAddress + '/shopify/callback';
      const installUrl = 'https://' + shop +
        '/admin/oauth/authorize?client_id=' + apiKey +
        '&scope=' + scopes +
        '&state=' + state +
        '&redirect_uri=' + redirectUri;
  
      res.cookie('state', state);
      return res.redirect(installUrl);
    } else {
      return res.status(400).send('Missing shop parameter. Please add ?shop=your-development-shop.myshopify.com to your request');
    }
}

exports.shopifyRedirect = (req, res) => {
    const { shop, hmac, code, state } = req.query;  
    if (shop && hmac && code) {
      const accessTokenRequestUrl = 'https://' + shop + '/admin/oauth/access_token';
      const accessTokenPayload = {
        client_id: apiKey,
        client_secret: apiSecret,
        code,
      };
      // return res.status(200).send(accessTokenPayload)
      axios.post(accessTokenRequestUrl, accessTokenPayload)
      .then((response) => {
        console.log(response.data)
        req.app.set('access_token', response.data.access_token)
        return res.redirect('/api/token')
      })
      .catch((error) => {
        return res.status(error.statusCode).send(error);
      });
    } else {
        res.status(400).send('Required parameters missing');
    }
};