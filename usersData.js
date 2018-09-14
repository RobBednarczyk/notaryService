/* ===== Persist data with LevelDB ===================================
|  Learn more: level: https://github.com/Level/level     |
|  =============================================================*/

const level = require('level');
const userDB = './usersdata';
const db = level(userDB);

// // Add data to levelDB with key/value pair
function addLevelDBdata(key,value){
  db.put(key, JSON.stringify(value), function(err) {
    if (err) return console.log('Block ' + key + ' submission failed', err);
  })
}

// get data from levelDB with key
async function getLevelDBdata(key) {
    try {
        var userString = await db.get(key);
        var user = await JSON.parse(userString);
        return user;
    }
    catch(err) {
        if (err.notFound) {
            return
        }
    }

}


// Add data to levelDB with value
function addDataToLevelDB(id, value) {
    let i = 0;
    db.createReadStream().on('data', function(data) {
          i++;
        }).on('error', function(err) {
            return console.log('Unable to read data stream!', err)
        }).on('close', function() {
          console.log('User #' + i);
          addLevelDBdata(id, value);
        });
}

// add function to remove the user with their address
function removeUser(id) {
    db.del(id, function(err) {
        if (err) {
            return console.log('Unable to delete the user!', err)
        }
    })
}

async function getBlockHeight() {
    let height = await getChainHeight();
    return height;
}

function getChainHeight() {
    return new Promise((resolve, reject) => {
        let i = 0;
        db.createReadStream().on("data", function(data) {
            i++;
        }).on("error", function(err) {
            reject("Unable to read data stream!");
        }).on("end", function() {
            resolve(i);
        });
    })

}

// async function getBlocksArray() {
//     //let blocks = [];
//     //let i = 0;
//     let blocks = await db.createValueStream().on('data', function(data) {
//         blocks.push(data);
//         })
//     return blocks
// }

function getUsersArray() {
    return new Promise((resolve, reject) => {
        let blocks = [];
        db.createReadStream().on("data", function(data) {
            blocks.push(JSON.parse(data.value));
        }).on("error", function(err) {
            reject("Unable to read data stream!");
        }).on("end", function() {
            resolve(blocks);
        });
    });
}

module.exports = {
    addLevelDBdata,
    addDataToLevelDB,
    getLevelDBdata,
    getChainHeight,
    getBlockHeight,
    removeUser,
    getUsersArray
}

/* ===== Testing ==============================================================|
|  - Self-invoking function to add blocks to chain                             |
|  - Learn more:                                                               |
|   https://scottiestech.info/2014/07/01/javascript-fun-looping-with-a-delay/  |
|                                                                              |
|  * 100 Milliseconds loop = 36,000 blocks per hour                            |
|     (13.89 hours for 500,000 blocks)                                         |
|    Bitcoin blockchain adds 8640 blocks per day                               |
|     ( new block every 10 minutes )                                           |
|  ===========================================================================*/
