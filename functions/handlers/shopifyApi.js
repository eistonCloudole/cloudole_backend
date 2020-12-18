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
                    quantity: res.data.products[i].variants[j].inventory_quantity,
                    inventory_item_id: res.data.products[i].variants[j].inventory_item_id
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

exports.modifyInventory = (shopName, shopToken) => {
    const url = `https://${shopName}/admin/api/2020-10/inventory_levels/adjust.json`
    const method = 'POST'
    return restApi(shopToken, url, method)
    .then((data) => {
        console.log('hjhh')
        console.log(data.data)
        return data.data
    })
    .catch((error) => {
        return error

})
}