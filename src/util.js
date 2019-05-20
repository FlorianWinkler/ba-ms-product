const exec = require('child_process').exec;
const MongoClient = require("mongodb").MongoClient;
const assert = require("assert");
const Product = require("../src/Product");

// const dbUrl = "mongodb://productDB:27017/productDB";
const dbUrl = "mongodb://10.0.0.166:27017/productDB";

const numPopulateItems = 1000;
const numTenants = 5;
const tenantBaseString = "tenant";

let hostname = "unknown_host";
let mongodbConn=null;


setHostname();
//wait one second until mongoDB has started properly, before retrieving DB connection
setTimeout(prepareDatabase,1000);

function getDatabaseConnection(callback) {
    if (mongodbConn == null) {
        MongoClient.connect(dbUrl, function (err, connection) {
            assert.equal(null, err);
            mongodbConn = connection;
            console.log("Retrieved new MongoDB Connection");
            callback(mongodbConn);
        });
    } else {
        callback(mongodbConn);
    }
}

function getDatabaseCollection(collectionName, callback){
    getDatabaseConnection(function(conn){
        var collection = conn.collection(collectionName);
        callback(collection);
    })
}

function prepareDatabase() {
    getDatabaseConnection(function(connection) {
            connection.dropDatabase();
            console.log("Dropped DB");
            mongodbConn = connection;
            populateDB();
        }
    );
}

function randomNumber(min,max){
    return Math.floor(Math.random()*(max-min+1)+min);
}

function compareNumber(a,b){
    return a-b;
}

function setHostname(){
    exec('hostname', function (error, stdOut) {
        hostname = stdOut.trim();
        console.log("Hostname set to: "+hostname);
    });
}
function getHostname(){
    return hostname;
}

function populateDB() {
    let productCollection;
    let nextProductId = 0;
    let nextTenantId = 0;

//--------insert Products--------
    getDatabaseCollection(tenantBaseString+nextTenantId, function (collection) {
        productCollection = collection;
        insertNextProduct()
    });

    function insertNextProduct() {
        if (nextProductId < numPopulateItems) {
            productCollection.updateOne(
                {_id: nextProductId.toString()},
                {$set: {product: (new Product("Product" + nextProductId, "Product" + nextProductId, nextProductId, Math.floor((Math.random() * 10) + 1)))}},
                {upsert: true},
                function (err, res) {
                    nextProductId++;
                    insertNextProduct();
                });
        } else {
            nextTenantId++;
            if(nextTenantId<numTenants) {
                console.log("Products inserted for " + tenantBaseString + nextTenantId);
                nextProductId = 0;
                getDatabaseCollection(tenantBaseString + nextTenantId, function (collection) {
                        productCollection = collection;
                        insertNextProduct();
                    }
                );
            }
            else{
                console.log("Finished Product insert");
            }
        }
    }
}


module.exports = {
    getDatabaseConnection: getDatabaseConnection,
    getDatabaseCollection: getDatabaseCollection,
    prepareDatabase: prepareDatabase,
    setHostname: setHostname,
    getHostname: getHostname,
    numPopulateItems: numPopulateItems,
    tenantBaseString: tenantBaseString,
    numTenants: numTenants
};
