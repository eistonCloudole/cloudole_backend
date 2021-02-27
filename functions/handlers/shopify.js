const nonce = require('nonce')();
const functions = require("firebase-functions");
const apiKey = functions.config().shopify.apikey;
const apiSecret = functions.config().shopify.apisecretkey;
const scopes = 'read_products,read_inventory,write_inventory';
const forwardingAddress = functions.config().url.forwardingaddress;
const frontendAddress = functions.config().url.frontendaddress;
const axios = require('axios');

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
        // req.app.set('access_token', response.data.access_token)
        let data_copy = JSON.parse(JSON.stringify(response.data))
        // return res.redirect('/api/token')
        data_copy['shop'] = shop
        const frontendURL = frontendAddress +
        '?token=' + data_copy.access_token +
        '&shop=' + shop;
  
        return res.redirect(frontendURL)
      })
      .catch((error) => {
        return res.status(error.statusCode).send(error);
      });
    } else {
        res.status(400).send('Required parameters missing');
    }
};
