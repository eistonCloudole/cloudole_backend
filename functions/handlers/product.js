const {shopifyProductList} = require("./shopifyApi")

exports.productList = (req, res) => {
    console.log(req.header)
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