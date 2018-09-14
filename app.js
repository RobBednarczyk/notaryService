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

function validationWindow(user) {
	let date = new Date();
    let secondsLeft = Math.max(300 - Number(date.getTime().toString().slice(0,-3)) + Number(user.timestamp), 0);
	return secondsLeft;
}


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
    let block = await blockchain.getBlock(blockheight);
    if (block) {
        res.send(block);
    } else {
        res.send({
            "error":"There is no such block. Sorry",
        })
    }
});

app.get("/address/:address", async (req, res) => {
    var address = req.params.address;
    var user = await Struct.getUser(address);
    if (!user) {
        res.send({
            "error":"There is no such address. Sorry",
        });
    } else {
        res.send(user);
    }

});

// app.get("/block", (req, res) => {
//     res.render("newBlock.hbs");
// })


app.post("/requestValidation", async (req, res) => {


    async function sendResponse(user, address) {
        //let date = new Date();
        //let secondsLeft = 300 - Number(date.getTime().toString().slice(0,-3)) + Number(user.timestamp);

        let mesResponse = {
            address: address,
            message: `${address}:${user.timestamp}:starRegistry`,
            requestTimeStamp: user.timestamp,

        };

        if (validationWindow(user) === 0) {
            mesResponse.walidationWindow = "Sorry, time's up. Please resubmit the address";
            await Struct.removeUser(address);
        } else {
            mesResponse.walidationWindow = validationWindow(user);;
        }

        res.send(mesResponse);
    }

	try {
		// check if the user inserted the address
		var address = req.body.address;
		if (!address) throw "Please provide the address";

	} catch(err) {
		res.send({
			"error":err,
		})
	}

    try {
        // check if the address already exists
        let user = await Struct.getUser(address);

		// check if the validationWindow has not expired
		if (user && validationWindow(user) === 0) {
			await Struct.removeUser(address);
		}


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

	// check if the user has provided the necessary data
	try {
		var address = req.body.address;
		var signature = req.body.signature;
		if (!address) throw "Please enter the address";
		if (!signature) throw "Please provide the signature of the message";
	}
	catch (err) {
		res.send({
			"error":err,
		})
	}

	try {
		var user = await Struct.getUser(address);
		if (!user) throw "The request for the validation has not been sent. Please repeat the process";
        var timeLeft = validationWindow(user);
        if (timeLeft === 0)  {
            throw "The validation window has expired. Please send the request one more time.";
            await Struct.removeUser(address);
        }

        var message = `${address}:${user.timestamp}:starRegistry`;

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
                "validationWindow": validationWindow(user),
                "messageSignature": messageSignature
            }
        });
	}
	catch(err) {
		res.send({
			"error":err,
		})
	}



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
	try {
		var address = req.body.address;
		if (!address) throw "Please provide the address";
	}
	catch(err) {
		res.send({
			"error": err,
		})
	}
    // get the user from the db
    try {
        var user = await Struct.getUser(address);
		if (!(user && user.valid)) throw "The address is not valid. Please send a request one more time";
	}
	catch(err) {
		res.send({
			"error": err,
		});
	}

    //console.log("before test");
	//try {
	var starObj = req.body.star;
			// check if the request has a star property
        if (!starObj) {
			try {
				var decodedStory = req.body.story;
                decodedStory.trim();
				if (!decodedStory) throw "Please provide the story";
            }
            catch(err) {
                res.send({
                    "error":err,
                })
            }
            try {
                const storyText = Buffer.from(String(decodedStory.trim()), "ascii");
                const encodedStory = storyText.toString("hex");
                var dec = req.body.declination;
                var mag = req.body.magnitude;
                var ra = req.body.ra;
                if (!(dec && ra)) throw "Please provide the required coordinates";
                var star = {
                    "dec": dec,
                    "mag": mag,
                    "ra": ra,
                    "const": req.body.constellation,
                    "story": encodedStory,
                    "decStory": decodedStory.trim(),
                };
                let blockBody = {
                    "address": address,
                    "star": star,
                };
                //console.log(blockBody);
                let newBlock = new Struct.Block(address, blockBody);
                //console.log(newBlock);
                try {
                    let modBlock = await blockchain.addBlock(newBlock);
                    let response = {
                        "hash": modBlock.hash,
                        "height": modBlock.height,
                        "body": modBlock.body,
                        "time": modBlock.time,
                        "previousBlockHash": modBlock.previousBlockHash,
                    };

                    // remove the address after every star registration
                    await Struct.removeUser(address);
                    res.send(response);
                } catch(err) {
                    res.send({
                        "error": "Please validate the address"
                    });
                }
            }
            catch(err) {
                res.send({
					"error":err,
				});
			}
				// catch(err) {
				// 	res.send({
				// 		"error": err,
				// 	});
				// }
		} else {
			try {
    			var decodedStory = starObj.story;
                decodedStroy.trim();
				if (!decodedStory) throw "Please provide the story";
            }
            catch(err) {
                res.send({
                    "error":err,
                });
            }
            try {
                const storyText = Buffer.from(String(starObj.story.trim()), "ascii");
                const encodedStory = storyText.toString("hex");
                var dec = starObj.declination;
                var mag = starObj.magnitude;
                var ra = starObj.ra;
                if (!(dec && ra)) throw "Please provide the required coordinates"
                var star = {
                    "dec": dec,
                    "mag": mag,
                    "ra": ra,
                    "const": starObj.constellation,
                    "story": encodedStory,
                    "decStory": decodedStory.trim(),
                };
                let blockBody = {
                    "address": address,
                    "star": star,
                };
                    //console.log(blockBody);
                let newBlock = new Struct.Block(address, blockBody);
                    //console.log(newBlock);
                try {
                    let modBlock = await blockchain.addBlock(newBlock);
                    let response = {
                        "hash": modBlock.hash,
                        "height": modBlock.height,
                        "body": modBlock.body,
                        "time": modBlock.time,
                        "previousBlockHash": modBlock.previousBlockHash,
                    };

                        // remove the address after every star registration
                    await Struct.removeUser(address);

                    res.send(response);
                } catch(err) {
                    res.send({
                        "error": "Please validate the address"
                    });
                }
            }
			catch(err) {
				res.send({
					"error": err,
				});
			}

				// }
				// catch(err) {
				// 	res.send({
				// 		"error": err,
				// 	});
				// }
		}

    // } catch(err) {
	// 	res.send({
	// 		"error": err,
	// 	})
	// }

});

// get the stars by wallet address
app.get("/stars/address::address", async (req, res) => {

	try {
		var address = req.params.address;
		if (!address) throw "Please provide the address";
	}
	catch(err) {
		res.send({
			"error": err,
		});
	}

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
	try {
		var hash = req.params.hash;
		if (!hash) throw "Please provide the address";
	}
	catch(err) {
		res.send({
			"error": err,
		});
	}

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
