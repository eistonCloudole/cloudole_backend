const { admin, db } = require("../util/admin")

const {restApi} = require("./restApi")


exports.shopifyProductList = (shopName, shopToken) => {
    const url = `https://${shopName}/admin/api/2020-10/products.json`
    const method = 'GET'
    return restApi(shopToken, url, method)
    .then((res) => {
        //console.log(res.data.products)
        products = {}
        for (i = 0; i < res.data.products.length; i++) {
            for (j = 0; j < res.data.products[i].variants.length; j++) {
                const product = {
                    product_id: res.data.products[i].id,
                    title: res.data.products[i].title,
                    variant_id: res.data.products[i].variants[j].id,
                    barcode: res.data.products[i].variants[j].barcode,
                    price: res.data.products[i].variants[j].price,
                    weight: res.data.products[i].variants[j].weight,
                    unit: res.data.products[i].variants[j].weight_unit,
                    quantity: res.data.products[i].variants[j].inventory_quantity
                }
                products[product.barcode] = product  
            }
        }
        return products
    }).catch((error) => {
        // if (Object.values(error.response.data) ===  '[API] Invalid API key or access token (unrecognized login or wrong password)') {
            return {
                error: error
            }
        // } else {
        //     return 
        // }
    })
}

exports.shopifyShopAddress = (shopName, shopToken) => {
    const url = `https://${shopName}/admin/api/2020-10/shop.json`
    const method = 'GET'
    return restApi(shopToken, url, method)
    .then((res) => {
        console.log(res)
        return res.data.shop
    })
}