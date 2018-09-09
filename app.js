// load express engine
const express = require("express");
// load handlebars framework
const hbs = require("hbs");
// load body-parser to get form parameters
const bodyParser = require("body-parser");
// load the module with 'Block' and 'Blockchain' classes
const Struct = require("./chainStructure");


// load the message verification libs
const bitcoin = require('bitcoinjs-lib');
const bitcoinMessage = require('bitcoinjs-message');

const port = 8000;

// helper functions to be used in the templates
hbs.registerHelper("getCurrentDate", () => {
    let days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday",
                "Saturday"];
    let months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep",
                    "Oct", "Nov", "Dec"];
    let date = new Date();
    let day = days[date.getDay()];
    let daynum = date.getDate();
    var suffix;

    switch (daynum) {
        case 1:
        case 21:
        case 31:
            var suffix = "st";
            break;
        case 2:
        case 22:
            var suffix = "nd";
            break;
        case 3:
        case 23:
            var suffix = "rd";
            break;
        default:
            var suffix = "th";
    }

    let month = months[date.getMonth()];
    let year = date.getFullYear()
    return `Today is ${day}, the ${daynum}${suffix} of ${month} ${year}.
            ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`;
});

hbs.registerHelper("convertMilToDate", (miliseconds) => {
    let date = new Date(Number(miliseconds));
    return date.toString();
});



// start a new blockchain
let blockchain = new Struct.Blockchain();


var app = express();
app.set("view engine", "hbs");
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));
// set public directory to store static files
app.use(express.static(__dirname + "/public"));

app.get("/", async (req, res) => {
    let allBlocks = await Struct.getAllBlocks();
    //console.log(allBlocks);
    res.render("home.hbs", {
        allBlocks: allBlocks,
    });
});

app.get("/block/:height", async (req, res) => {
    let blockheight = req.params.height;
    try {
        let block = await blockchain.getBlock(blockheight);
        res.send(block);
    } catch(error) {
        res.send({
            "error":"There is no such block. Sorry",
        })
    }
});

app.get("/address/:address", async (req, res) => {
    let address = req.params.address;
    try {
        let user = await Struct.getUser(address);
        res.send(user);
    } catch(error) {
        res.send({
            "error":"There is no such address. Sorry",
        })
    }
});

// app.get("/block", (req, res) => {
//     res.render("newBlock.hbs");
// })


app.post("/requestValidation", async (req, res) => {

    async function sendResponse(user, address) {
        let date = new Date();
        let secondsLeft = 300 - Number(date.getTime().toString().slice(0,-3)) + Number(user.timestamp);

        let mesResponse = {
            message: `${address}:${user.timestamp}:starRegistry`,
            timestamp: user.timestamp,

        };

        if (secondsLeft < 0) {
            mesResponse.secondsLeft = "Sorry, time's up. Please resubmit the address";
            await Struct.removeUser(address);
        } else {
            mesResponse.secondsLeft = secondsLeft;
        }

        res.send(mesResponse);
    }

    let address = req.body.address;

    try {

        let user = await Struct.getUser(address);

        // check if the address has already been validated
        if (user.valid) {
            let response = {
                "address": address,
                "requestTimeStamp": user.timestamp,
                "message": `${address}:${user.timestamp}:starRegistry`,
                "validationWindow": 300
            }
            res.send(response);
        } else {
            sendResponse(user, address);
        }

    } catch(err) {

        let user = await Struct.addUser(address);

        sendResponse(user, address);
    }
})


app.post("/message-signature/validate", async (req, res) => {

    let address = req.body.address;
    let signature = req.body.signature;
    let user = await Struct.getUser(address);
    let message = `${address}:${user.timestamp}:starRegistry`;

    var registerStatus = false;
    var messageSignature = "invalid";


    // validate the given signature
    if (bitcoinMessage.verify(message, address, signature)) {

        // change the valid status of the address
        await Struct.modUser(address, user.timestamp, true);

        registerStatus = true,
        messageSignature = "valid";
    }

    res.send({
        "registerStar": registerStatus,
        "status": {
            "address": address,
            "requestTimeStamp": user.timestamp,
            "message": `${address}:${user.timestamp}:starRegistry`,
            "validationWindow": (() => {
                let date = new Date();
                let secondsLeft = Math.max(300 - Number(date.getTime().toString().slice(0,-3)) + Number(user.timestamp), 0);
                return secondsLeft;
            })(),
            "messageSignature": messageSignature
        }
    });
})

// render the star registration page
app.get("/regPage", (req, res) => {
    res.render("registerStar.hbs");
});

// provide method to register a star
app.get("/block", (req, res) => {
    res.render("validateUser.hbs");
})

app.post("/block", async (req, res) => {

    // get the provided address
    let address = req.body.address;
    console.log(address);
    // get the user from the db
    try {
        let user = await Struct.getUser(address);
        console.log(user);
        console.log(user.valid);
        if (!user.valid) {
            //res.render("userNotValid.hbs");
            res.send({
                "error":"address has not been validated"
            })
        } else {
            console.log("before test");
            let starObj = req.body.star;
            console.log(starObj);
            if (starObj) {
                console.log("inside extended");
                const storyText = Buffer.from(String(starObj.story.trim()), "ascii");
                const encodedStory = storyText.toString("hex");
                var star = {
                    "dec": starObj.declination,
                    "mag": starObj.magnitude,
                    "ra": starObj.ra,
                    "const": starObj.constellation,
                    "encStory": encodedStory,
                    "story": starObj.story,
                }
            } else {
                console.log("inside normal");
                const storyText = Buffer.from(String(req.body.story.trim()), "ascii");
                const encodedStory = storyText.toString("hex");
                var star = {
                    "dec": req.body.declination,
                    "mag": req.body.magnitude,
                    "ra": req.body.ra,
                    "const": req.body.constellation,
                    "encStory": encodedStory,
                    "story": req.body.story,
                }
                console.log(star);
            }


            let blockBody = {
                "address": address,
                "star": star,
            };
            console.log(blockBody);
            let newBlock = new Struct.Block(address, blockBody);
            console.log(newBlock);
            try {
                let modBlock = await blockchain.addBlock(newBlock);
                let response = {
                    "hash": modBlock.hash,
                    "height": modBlock.height,
                    "body": modBlock.body,
                    "time": modBlock.time,
                    "previousBlockHash": modBlock.previousBlockHash,
                };

                res.send(response);
            } catch(err) {
                res.send({
                    "error": err
                })
            }
        }
    } catch(err) {
        res.send({
            "error": err
        })
    }

});

// get the stars by wallet address
app.get("/stars/address::address", async (req, res) => {

    let address = req.params.address;

    let allStars = await Struct.getAllBlocks();
    let starsByAddress = [];
    for (var i = 0; i < allStars.length; i++) {
        if (allStars[i].userID === address) {
            starsByAddress.push(allStars[i]);
        }
    }

    res.send(starsByAddress);

});

// get the star by its hash
app.get("/stars/hash::hash", async (req, res) => {
    let hash = req.params.hash;
    console.log(hash);
    let allStars = await Struct.getAllBlocks();
    let starByHash = [];
    for (var i = 0; i < allStars.length; i++) {
        if (allStars[i].hash === hash) {
            starByHash.push(allStars[i]);
        }
    }

    res.send(starByHash);

    // uncomment if a webpage is to be sent
    // res.render("starsByAddress.hbs", {
    //     stars : starByHash,
    // })

});

app.listen(port, () => console.log(`Server started on port: ${port}`));
