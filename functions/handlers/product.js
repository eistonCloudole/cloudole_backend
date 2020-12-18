const {shopifyProductList, modifyInventory} = require("./shopifyApi")

exports.productList = (req, res) => {
    console.log(req.header('shopifyToken'))
    const apiInfo = {
        shopifyShopName:req.header('shopifyShopName'),
        shopifyToken: req.header('shopifyToken'),
    }
    // const apiInfo = {
    //     shopifyShopName: 'ameni-coco-test.myshopify.com',
    //     shopifyToken: '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'
    // }
    return shopifyProductList(apiInfo.shopifyShopName, apiInfo.shopifyToken)
    .then((products) => {
        //console.log(products)
        return res.status(200).json(products)
    })
    .catch((error)=> {
        console.log(error.response)
    })
}

exports.modifyInventory = (req, res) => {
    // console.log(req.body.shopifyToken)
    // const apiInfo = {
    //     shopifyShopName:req.body.shopifyShopName,
    //     shopifyToken: req.body.shopifyToken,
    //     location_id: req.body.location_id,
    //     inventory_item_id: req.body.inventory_item_id,
    //     available_adjustment: req.body.available_adjustment
    // }
    req.httpShouldHandleCookies = false
    const apiInfo = {
        shopifyShopName:'ameni-coco-test.myshopify.com',
        shopifyToken:'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'
    }
    return modifyInventory(apiInfo.shopifyShopName, apiInfo.shopifyToken)
    .then((products) => {
        console.log(products)
        return res.status(200).json(products)
    })
    .catch((error)=> {
        console.log(error.response)
    })
}