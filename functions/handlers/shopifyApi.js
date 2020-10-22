const { admin, db } = require("../util/admin")
const axios = require('axios');
const restApi = (token, url, method) => {
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


exports.productList = (request, response) => {
    // const apiInfo = {
    //     shopifyShopName: request.body.shopifyShopName,
    //     shopifyToken: request.body.shopifyToken
    // }
    products = {
    }
    const apiInfo = {
        shopifyShopName: 'ameni-coco-test.myshopify.com',
        shopifyToken: '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'
    }
    const url = `https://${apiInfo.shopifyShopName}/admin/api/2020-10/products.json`
    const method = 'GET'

    restApi(apiInfo.shopifyToken, url, method)
    .then((res) => {
        for (i = 0; i < res.data.products.length; i++) {
            _id = res.data.products[i].id
            const product = {
                title : res.data.products[i].title,
                barcode: res.data.products[i].variants[0].barcode,
                price: res.data.products[i].variants[0].price
            }
            products[_id] = product       
        }
        console.log(products)
        return db.doc(`/${apiInfo.shopifyShopName}/products`).set(products)
        .then(() => {
            return response.status(200).json(products)
        })

    }).catch((error) => {
        console.log(error)
    })
}