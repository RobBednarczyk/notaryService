// load express engine
const express = require("express");
// load handlebars framework
const hbs = require("hbs");
// load body-parser to get form parameters
const bodyParser = require("body-parser");
// load the module with 'Block' and 'Blockchain' classes
const Struct = require("./chainStructure");

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
    let hobby = "football";
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
        res.render("noSuchBlock.hbs");
    }
});

app.get("/newBlock", (req, res) => {
    res.render("newBlock.hbs");
})

app.post("/newBlock", async (req, res) => {
    let body = req.body.blockBody;
    console.log(body);
    let newBlock = new Struct.Block(body);
    let modBlock = await blockchain.addBlock(newBlock);
    res.send(modBlock);
})

app.listen(port, () => console.log(`Server started on port: ${port}`));
