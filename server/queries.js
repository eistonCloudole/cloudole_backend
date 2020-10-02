const { graphQLClient } = require('./apiClient.js');
const axios = require('axios');

  // Returns a list of products
const restApi = (auth, url, method) => {
    const settings = {
      async: true,
      crossDomain: true,
      url: url,
      method: method,
      headers: {
          'X-Shopify-Access-Token': auth.token,
          'Content-Type': 'application/json'
      },
      timeout: 10000
  };

  return axios(settings)



}


module.exports = {
  restApi
};
