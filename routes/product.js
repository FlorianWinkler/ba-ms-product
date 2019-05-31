require('dotenv').config();
const express = require('express');
const router = express.Router();
const assert = require("assert");
const Product = require('../src/Product');
const util = require('../src/util');


let reqcounter = 0;
let nextProductId = 0;

router.get('/', function(req, res, next) {
    res.send('Product Service running!');
});

router.get('/preparedb', function(req, res, next) {
    util.prepareDatabase();
    res.send('Populating Product DB...');
});

router.post('/edit', function(req, res) {
    reqcounter++;

    let randomId = Math.floor((Math.random() * util.numPopulateItems-1)).toString();
    let randomType = Math.floor((Math.random() * 10)).toString();
    let randomTenant = util.tenantBaseString+Math.floor((Math.random() * util.numTenants));
    let product = new Product(
        req.body.name+randomId,
        req.body.description+randomId,
        randomId,
        randomType);
    // console.log(randomTenant);
    upsertProduct(randomId, randomTenant, product, function (upsertedProduct) {
        res.json(upsertedProduct);
    });
});

//without URL Parameter for random Product retrieval
router.get('/get', function(req, res) {
    reqcounter++;
    let randomProductId = Math.floor((Math.random() * util.numPopulateItems-1)).toString();
    let randomTenant = util.tenantBaseString+Math.floor((Math.random() * util.numTenants));
    // console.log("Tenant: "+randomTenant);
    findProductById(randomProductId, randomTenant, function(dbResponse){
        if(dbResponse != null ){
            res.json(dbResponse);
        }
        else{
            res.status(400).end();
        }
    });
});

//with URL Parameter for usage with shoppingCart service
router.get('/get/:tenantId/:productId', function(req, res) {
    reqcounter++;

    findProductById(req.params.productId, req.params.tenantId, function(dbResponse){
        if(dbResponse != null ){
            res.json(dbResponse);
        }
        else{
            res.status(400).end();
        }
    });
});

router.get('/search', function(req, res) {
    reqcounter++;
    let searchStr = Math.floor((Math.random() * 10)+10).toString();
    let randomTenant = util.tenantBaseString+Math.floor((Math.random() * util.numTenants));
    // console.log(searchStr);
    console.log("Tenant: "+randomTenant);
    searchProducts(searchStr, randomTenant, function(dbResponse){
        if(dbResponse != null ){
            res.json(dbResponse);
        }
        else{
            res.status(404).end();
        }
    });
});

function upsertProduct(id, tenant, product, callback){
    util.getDatabaseCollection(tenant,function (collection) {
            collection.updateOne(
                {_id: id},
                {$set: {product: product}},
                {upsert: true},
                function (err, res) {
                if(err != null && err.code === 11000){
                    //conn.close();
                    //console.log(err);
                    //console.log("Caught duplicate Key error while writing document! Retry...");
                    setTimeout(upsertProduct,100, id, product, callback);
               }
                else {
                    assert.equal(err, null);
                    // nextProductId++;
                    callback({
                       _id: id,
                       product: product
                    });
               }
            });
        });
}

function findProductById(id, tenant, callback) {
    util.getDatabaseCollection(tenant,(async function (collection) {
        // console.log(id);
        let retProduct = await collection.findOne({"_id": id});
        // console.log(retProduct);
        callback(retProduct);
    }));
}

function searchProducts(searchStr, tenant, callback){
    util.getDatabaseCollection(tenant,(async function (collection) {
        let retProducts = await collection.find({"product.name": {$regex : searchStr}}).toArray();
        //console.log(retUser);
        callback(retProducts);
    }));
}


module.exports = router;
