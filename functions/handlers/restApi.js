const axios = require('axios');

exports.restApi = (token, url, method, body=new Object(), param=new Object()) => {
    const settings = {
      async: true,
      crossDomain: true,
      url: url,
      method: method,
      headers: {
          'X-Shopify-Access-Token': token,
          'Content-Type': 'application/json',
      },

      timeout: 10000,

  };
  if (settings.method === 'POST') {
    settings.data = body
  }
  if (settings.method === 'GET') {
    settings.params = param
    console.log(param, token, url)
  }
  return axios(settings)
}