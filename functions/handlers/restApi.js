const axios = require('axios');

exports.restApi = (token, url, method) => {
    const settings = {
      async: true,
      crossDomain: true,
      url: url,
      method: method,
      headers: {
          'X-Shopify-Access-Token': token,
          'Content-Type': 'application/json'
      },
      timeout: 10000
  };
    return axios(settings)
}