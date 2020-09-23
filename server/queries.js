const { graphQLClient } = require('./apiClient.js');

module.exports = {
  // Returns a list of products
  getProducts(auth) {
    const query = `{
              products(first: 10) {
                edges {
                    node {
                       title
                       id
                    }
                }
            }
          }`;
    return graphQLClient(query, auth);
    }
}

