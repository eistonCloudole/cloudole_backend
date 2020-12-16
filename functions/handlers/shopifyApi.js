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
            return {
                error: error
            }
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

exports.modifyInventory = (req, res) => {
    const url = `https://ameni-coco-test.myshopify.com/admin/api/2020-10/inventory_items/5851737358498.json`
    const method = 'PUT'
    return restApi('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', url, method)
    .then((data) => {
        console.log(data)
        return res.status(200).json(data)
    })
    .catch((error)=> {
        console.log(error.response)
    })
}