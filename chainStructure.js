const SHA256 = require('crypto-js/sha256');
const level = require("./levelSandbox.js");

async function getAllBlocks() {
    let blocks = await level.getBlocksArray();
    return blocks
}

class Block{
	constructor(data){
     this.hash = "",
     this.height = 0,
     this.body = data,
     this.time = 0,
     this.previousBlockHash = ""
    }
}

class Blockchain{
    constructor(){
        level.getBlockHeight().then((height) => {
            // check if the blockchain has any blocks
            if (height === 0) {
                console.log("Starting the genesis block");
                this.addBlock(new Block("First block in the chain - Genesis block"));
            }
        });
    }

  // Add new block
    async addBlock(newBlock) {
        let height = await level.getChainHeight();
        newBlock.height = height + 1;

        if (height > 0) {
            let previousBlock = await level.getLevelDBdata(height - 1);
            newBlock.previousBlockHash = previousBlock.hash;
        }

        //newBlock.time = new Date().getTime().toString().slice(0,-3);
        newBlock.time = new Date().getTime().toString();
        newBlock.hash = SHA256(JSON.stringify(newBlock)).toString();
        await level.addDataToLevelDB(newBlock);
        return newBlock
    }

  // Get block height
    getBlockHeight() {
        level.getBlockHeight().then((num) => console.log(num));
    }

    // get block
    getBlock(blockHeight){
      //level.getLevelDBdata(blockHeight).then((block) => console.log(block));
      return level.getLevelDBdata(blockHeight);
    }

    // check if the given block is valid
    async isBlockValid(blockHeight) {
        // fetch the block and its hash
        let block = await level.getLevelDBdata(blockHeight);
        let blockhash = block.hash;
        // remove the hash from the block
        block.hash = "";
        // recalculate the hash
        let validBlockHash = SHA256(JSON.stringify(block)).toString();
        if (blockhash === validBlockHash) {
            return true
        } else {
            return false;
        }
    }

    validateBlock(blockHeight) {
        this.isBlockValid(blockHeight).then((valid) => {
            valid ? console.log("Block #" + blockHeight + " is valid.") : console.log("Block #" + blockHeight + " is not valid!");
        });
    }

   // check if the chain is valid
    async isChainValid() {
        let errorLog = [];
        let height = await level.getBlockHeight();
        for (var i = 0; i < height; i++) {
            let validBlock = await this.isBlockValid(i);
            if (!validBlock) {
                errorLog.push(i);
            }

            let block = await level.getLevelDBdata(i);
            let blockHash = block.hash;
            if (i < (height - 1)) {
                let nextBlock = await level.getLevelDBdata(i+1);
                let previousBlockHash = nextBlock.previousBlockHash;
                if (blockHash !== previousBlockHash) {
                    errorLog.push(i);
                }
            }
        }
        if (errorLog.length>0) {
          console.log('Block errors = ' + errorLog.length);
          console.log('Blocks: '+errorLog);
          return false
        } else {
          console.log('No errors detected');
          return true
        }

    }

    validateChain() {
        this.isChainValid().then((valid) => {
            valid ? console.log("The chain is valid") : console.log("The chain is not valid");
        })
    }

}

module.exports = {
    Block,
    Blockchain,
    getAllBlocks
}
