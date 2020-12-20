const axios = require('axios');

exports.restApi = (token, url, method, body=new Object()) => {
    console.log(body)
    axios.defaults.withCredential = true
    const settings = {
      async: true,
      crossDomain: true,
      url: url,
      method: method,
      headers: {
          'X-Shopify-Access-Token': token,
          'Content-Type': 'application/json',
      },

      timeout: 1000,

  };
  if (settings.method === 'POST') {
    settings.data = body
  }
  return axios(settings)
}