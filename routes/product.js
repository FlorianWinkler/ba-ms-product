require('dotenv').config();
const express = require('express');
const router = express.Router();
const assert = require("assert");
const Product = require('../src/Product');
const util = require('../src/util');

let reqcounter = 0;
let nextProductId = 0;

router.post('/edit', function(req, res) {
    reqcounter++;

    let randomId = Math.floor((Math.random() * 100)).toString();
    let randomType = Math.floor((Math.random() * 10)).toString();
    let product = new Product(
        req.body.name+randomId,
        req.body.description+randomId,
        randomId,
        randomType);

    upsertProduct(randomId, product, function (upsertedProduct) {
        res.json(upsertedProduct);
    });
});

router.get('/get', function(req, res) {
    reqcounter++;
    let random = Math.floor((Math.random() * 100)).toString();

    findProductById(random, function(dbResponse){
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
    // console.log(searchStr);
    searchProducts(searchStr, function(dbResponse){
        if(dbResponse != null ){
            res.json(dbResponse);
        }
        else{
            res.status(404).end();
        }
    });
});

function upsertProduct(id, product, callback){
    util.getDatabaseCollection(util.productCollectionName,function (collection) {
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

function findProductById(id, callback) {
    util.getDatabaseCollection(util.productCollectionName,(async function (collection) {
        // console.log(id);
        let retProduct = await collection.findOne({"_id": id});
        // console.log(retProduct);
        callback(retProduct);
    }));
}

function searchProducts(searchStr, callback){
    util.getDatabaseCollection(util.productCollectionName,(async function (collection) {
        let retProducts = await collection.find({"product.name": {$regex : searchStr}}).toArray();
        //console.log(retUser);
        callback(retProducts);
    }));
}


module.exports = router;
