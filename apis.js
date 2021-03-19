const request = require("request"); // requesting data from api
const cheerio = require("cheerio"); // web scraping (for images)

const ApiFunctions = {

    async saveGifsToCards(amount, search, channel, main, cards, users) { // get gifs from tenor api
        let ans = [];

        let json;
        if (amount < 1) {
            amount = 1;
        } else if (amount > 50) {
            amount = 50;
        } // max 50 gifs at a time
        let url = "https://api.tenor.com/v1/search?q=" + search + "&key=" + process.env.TENOR_KEY + "&limit=" + amount;
        console.log("Requesting gifs from Tenor...");
        lastMsg = await channel.send("Agregando " + amount + " gifs al comando `" + main + "`...");
    
        request(url, function(error, response, body) { // actual request
            if (!error && response.statusCode == 200) { // success!
                json = JSON.parse(body);
                for (var i = 0; i < json["results"].length; i++) {
                    cards[main].push([json["results"][i]["media"][0]["gif"]["url"], "gif", "", 0, 1, 0, ""]);
                    for (u in users) {
                        if (u == "name") { continue }
                        users[u]["col"][main].push(false);
                    }
                }
                console.log("Saved " + amount + " gifs");
                lastMsg.edit("Agregando " + amount + " gifs al comando `" + main + "`... Listo");
                thereWasChange = true;
            } else { // failure
                console.log("Getting gifs failed");
                lastMsg.edit("Agregando " + amount + " gifs al comando `" + main + "`... Error");
            }
        });
    },

    async saveImgsToCards(amount, search, channel, main, cards, users) { // get images using cheerio web scraping
        let json;
        if (amount < 1) {
            amount = 1;
        } else if (amount > 50) {
            amount = 50;
        } // max 50
        let options = {
            url: "http://results.dogpile.com/serp?qc=images&q=" + search,
            method: "GET",
            headers: {
                "Accept": "text/html",
                "User-Agent": "Chrome"
            }
        };
        console.log("Requesting images from Dogpile...");
        lastMsg = await channel.send("Agregando " + amount + " imágenes al comando `" + main + "`...");
    
        request(options, async function(error, response, body) { // actual request
            if (!error && response.statusCode == 200) { // success
                $ = await cheerio.load(body);
                var links = $(".image a.link");
                var urls = [];
                for (var i = 0; i < amount; i++) {
                    cards[main].push([links.eq(i).attr("href"), "img", "", 0, 1, 0, ""]);
                    for (u in users) {
                        if (u == "name") { continue }
                        users[u]["col"][main].push(false);
                    }
                }
                console.log("Saved " + amount + " images");
                lastMsg.edit("Agregando " + amount + " imágenes al comando `" + main + "`... Listo");
                thereWasChange = true;
            } else { // failure
                console.log("Getting imgs failed");
                lastMsg.edit("Agregando " + amount + " imágenes al comando `" + main + "`... Error");
            }
        });
    },

    async getGif(string, main, cards, users) { // used for manually entering gifs that were obtained through tenor gif keyboard in discord
        let json;
        let splitString = string.split("-");
        let id = splitString[splitString.length - 1];
        let url = "https://api.tenor.com/v1/gifs?ids=" + id + "&key=" + process.env.TENOR_KEY;
        console.log("Requesting a gif from Tenor...");
    
        request(url, function(error, response, body) {
            if (!error && response.statusCode == 200) {
                json = JSON.parse(body);
                cards[main].push([json["results"][0]["media"][0]["gif"]["url"], "gif", "", 0, 1, 0, ""]);
                for (u in users) {
                    if (u == "name") { continue }
                    users[u]["col"][main].push(false);
                }
                console.log("Saved 1 gif");
            } else {
                console.log("Failed getting a gif");
            }
        });
    }

};

module.exports = ApiFunctions;