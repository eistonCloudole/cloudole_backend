const { object } = require("firebase-functions/lib/providers/storage")
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

exports.modifyInventory = (shopName, shopToken, body) => {
    const url = `https://${shopName}/admin/api/2020-10/inventory_levels/adjust.json`
    const method = 'POST'
    return restApi(shopToken, url, method, body, new Object())
    .then((data) => {
        console.log(data.data)
        return data.data
    })
    .catch((error) => {
        return error

})
}

exports.getInventory = (shopName, shopToken, param) => {
    const url = `https://${shopName}/admin/api/2020-10/inventory_levels.json`
    const method = 'GET'
    // console.log(param)
    return restApi(shopToken, url, method, new Object(), param)
    .then((data) => {
        // console.log(data.data)
        return data.data
    })
    .catch((error) => {
        return error

})
}


exports.findLocation = (shopName, shopToken) => {
    const url = `https://${shopName}/admin/api/2020-10/locations.json`
    const method = 'GET'
    return restApi(shopToken, url, method)
    .then((data) => {
        let location = []
        for (let i = 0; i < data.data.locations.length; i++) {
            location.push({
                id: data.data.locations[i].id,
                address: data.data.locations[i].address1 + data.data.locations[i].city +  data.data.locations[i].province + data.data.locations[i].country,
                active: data.data.locations[i].active
            })
        }
        return location
    })
    .catch((error) => {
        return error
})
}