// --------------------------------------------------IMPORTS------------------------------------------------------------
const Discord = require("discord.js");
const request = require("request");
const cheerio = require("cheerio");
const convert = require('color-convert');
require("console-stamp")(console, "HH:MM:ss");
const { Pool } = require("pg");
require("dotenv").config();

// ------------------------------------------------BASE OBJECTS---------------------------------------------------------
// DATABASE
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});
// DISCORD
const client = new Discord.Client();

// ------------------------------------------------GLOBAL VARIABLES-----------------------------------------------------
// DATA
let cards = {name:"cards"}; // { ... command: [ [ 0content, 1type, 2owner, 3value, 4multiplier, 5name], ... ] }
let config = {name:"config"}; // { ... prefix: prefix }
let users = {name:"users"}; // { ... user: { bal: [ balance, timeOfBalance, income ] , rolls: [ rolls, timeOfRolls ], reacts: [ same ], buys: ..., invs: ...,  col: collection } }   //   collection = { command: [ 1st card owned, 2nd... ] }
// STATIC
const regionalIndicators = [

    "🇦","🇧","🇨","🇩","🇪","🇫","🇬","🇭","🇮","🇯","🇰","🇱","🇲","🇳","🇴","🇵","🇶","🇷","🇸","🇹","🇺","🇻","🇼","🇽","🇾","🇿"
];
const coolReactions = [
    "💯",
    "😊",
    "❤",
    "✅",
    "🔥"
];
const rejectionMsg = [
    "Naa",
    "No quiero",
    "NO",
    "Ni ganas bro",
    "Soy tu esclavo?",
    "Te creés crack?",
    "Nop.",
    "Dato",
    "Contame otro chiste",
    "Nope",
    "Nej",
    "No molestes"
];
const cardHelpMsg = [
    "`card <colección> <número>` muestra una carta específica de una colección",
    "`card list` muestra todas las colecciones y sus detalles",
    "`inv <colección> <número>` invierte plata en la carta",
    "`bal (<usuario>)` muestra el balance de un usuario (default = el tuyo)",
    "`roll` o `r` muestra una carta al azar que se puede comprar si no es de nadie",
    "`sell <colección> <número>` vende una carta por la mitad de su valor",
    "`sell <colección> all` vende todas las cartas de una colección por la mitad de sus valores",
    "`rolls`, `reacts`, `buys` y `invs` (<usuario>) muestran las acciones disponibles del usuario (default = las tuyas)",
    "`col` muestra datos sobre toda tu colección",
    "`col <colección>` muestra los datos de todas tus cartas pertenecientes a una colección",
    "`c <colección> <número> rename <nombre>` renombra una carta si es tuya",
    "`p` o `prev` muestra la carta anterior",
    "`n` o `next` muestra la carta siguiente",
    "`top` muestra las 20 cartas más valiosas"
];
const helpMsg = [
    "`< >` indica un parámetro o comando de una lista o dado por el usuario",
    "`( )` indica un parámetro opcional",
    "`prefix <prefijo>` cambia el prefijo de los comandos",
    "`help` o `h` muestra todos los comandos disponibles",
    "`new` muestra los comandos más nuevos",
    "`reset` reinicia la conexión entre Momo y Discord",
    "`save` guarda todos los datos permanentemente (cada 5 minutos ocurre automáticamente)",
    "`game` muestra todos los minijuegos disponibles",
    "`game <juego>` inicia una partida del minijuego",
    "`card help` muestra todos los comandos relacionados a cartas",
    "`user (<usuario>)` o `u (<usuario>)` muestra la información de un usuario",
    "`user list` muestra información básica de todos los usuarios",
    "`give <usuario> <colección> <número>` le da a un usuario una de tus cartas",
    "`give <usuario> <plata>` le da parte de tu plata a un usuario",
    "`repeat (<cantidad de veces>) <mensaje>` repite una cantidad de veces un mensaje (default = x1)",
    "`stop` frena el comando `repeat`",
    "`exit` apaga el bot (se reinicia automáticamente pasados ~10 minutos)",
    "`list` muestra todos los comandos personalizados y la cantidad de opciones disponibles para cada uno",
    "`list help` muestra todos los subcomandos disponibles relacionados a los comandos perzonalizados",
    "`+ <cmd>` agrega un comando personalizado",
    "`- <cmd>` remueve un comando personalizado",
];
const newMsg = [
    "`prefix <prefijo>` cambia el prefijo de los comandos",
    "`save` guarda todos los datos permanentemente (cada 5 minutos ocurre automáticamente)",
    "`repeat (<cantidad de veces>) <mensaje>` repite una cantidad de veces un mensaje (default = x1)",
    "`card <colección> <número>` muestra una carta específica de una colección",
    "`sell <colección> <número>` vende una carta por la mitad de su valor",
    "`user (<usuario>)` muestra la información de un usuario",
    "`col` muestra datos sobre toda tu colección",
    "`col <colección>` muestra los datos de todas tus cartas pertenecientes a una colección",
    "`card help` muestra todos los comandos relacionados a cartas",
    "`roll` o `r` muestra una carta al azar que se puede comprar si no es de nadie",
    "`p` o `prev` muestra la carta anterior",
    "`n` o `next` muestra la carta siguiente",
    "`top` muestra las 20 cartas más valiosas"
];
const miniGameMsg = [

    "`connect4 (<anchura>x<altura>)` inicia una partida de 4 en línea, con un tablero del tamaño seleccionado (default = 10x10)"
];
const helpListMsg = [
    "`<cmd> list` muestra todos las opciones del comando",
    "`<cmd> <número de opción>` muestra una opción específica",
    "`<cmd>` muestra una opción al azar",
    "`<cmd> + <opción>` agrega una opción",
    "`<cmd> + <cantidad> gifs (<término de búsqueda>)` agrega gifs según el término de búsqueda (default = <cmd>)",
    "`<cmd> + <cantidad> imgs (<término de búsqueda>)` agrega imágenes según el término de búsqueda (default = <cmd>)",
    "`<cmd> - <número de opción>` remueve una opción específica",
    "`<cmd> - all` remueve todas las opciones",
    "`<cmd> - last` remueve la última opción que salió al azar",
    "`<cmd> -` remueve la última opción"
];
// AUXILIARY
let lastMsg;
let thereWasChange = false;
let lastOptionIndex = -1;
let stopSpam = false;
let repeating = false;
let currentlyViewingCard = false;
let currentView = ["collection", "card number"];
// GAMES
let game;
let gameName;
let board;
let boardMsg;
// CARDS
let maxValue = -1;
let rollCache = [];
let maxRollCache = 20;
let currentRollCacheIndex = 0;
// ECONOMY
let baseCardValue = 10;
let rates = {
    "reacts": 4,
    "buys": 3,
    "rolls": 12,
    "invs": 1
};

// ---------------------------------------------------STARTUP-----------------------------------------------------------
// DATABASE
console.log("Retrieving data from database...");
fileAll("r");
// DISCORD
console.log("Connecting to Discord...");
client.login(process.env.DISCORD_TOKEN);
client.on("ready", function() {

    console.log("Connection to Discord established!");
});

// ---------------------------------------------------FUNCTIONS---------------------------------------------------------
// DATABASE
async function file(object, mode) {
    let stringy = JSON.stringify(object);
    let name = object["name"];
    const database = await pool.connect();
    if (mode == "r") {
        let response = await database.query("SELECT value FROM " + name + ";");
        let json = await response["rows"][0]["value"];
        setValue(name, json);
        console.log("Dictionary '" + name + "' loaded");
    } else if (mode == "w") {
        await database.query("UPDATE " + name + " SET value = '" + stringy + "';");
        console.log("Dictionary '" + name + "' saved");
    }
    database.release();
}
// DATA
function setValue(name, value) {
    switch(name) {
        case "cards":
            cards = value;
            break;
        case "config":
            config = value;
            break;
        case "users":
            users = value;
            break;
    }
}
async function fileAll(mode) {
    await file(cards, mode);
    await file(config, mode);
    await file(users, mode);
    findMaximumValue();
}
function owners(array) {
    let ans = [];
    for (var i = 0; i < array.length; i++) {
        if (array[i][2] && !ans.includes(array[i][2])) {
            ans.push(array[i][2]);
        }
    }
    return ans;
}
// DISCORD
async function reset() {
    await client.destroy();
    console.log("Logged out from Discord. Re-logging...");
    await client.login(process.env.DISCORD_TOKEN);
    console.log("Connection to Discord re-established!");
}
async function updatePresence() {
    try {
        await client.user.setPresence({
        status: "online",
        activity: {
            name: config["prefix"] + "help",
            type: "LISTENING"
        }
    });
    } catch(error) {
        console.log("ERROR: Could not set presence");
    }
}
async function manageReactions(reaction, user) {
    thereWasChange = true;
    // -----------------------------------------------GAMES---------------------------------------------- //
    if (reaction.message == boardMsg && !user.bot && !game.ended) {
        if (gameName == "c4") {
            if (game.turn == 1) {
                if (game.a == "") {
                    game.a = await reaction.message.guild.member(user).nickname;
                    game.act(regionalIndicators.indexOf(reaction.emoji.name));
                    board.setDescription(game.renderBoard()).setTitle(game.renderTitle());
                    await boardMsg.edit(board);
                } else if (game.a == reaction.message.guild.member(user).nickname) {
                    game.act(regionalIndicators.indexOf(reaction.emoji.name));
                    board.setDescription(game.renderBoard()).setTitle(game.renderTitle());
                    await boardMsg.edit(board);
                }
            } else {
                if (game.b == "") {
                    game.b = await reaction.message.guild.member(user).nickname;
                    game.act(regionalIndicators.indexOf(reaction.emoji.name));
                    board.setDescription(game.renderBoard()).setTitle(game.renderTitle());
                    await boardMsg.edit(board);
                } else if (game.b == reaction.message.guild.member(user).nickname) {
                    game.act(regionalIndicators.indexOf(reaction.emoji.name));
                    board.setDescription(game.renderBoard()).setTitle(game.renderTitle());
                    await boardMsg.edit(board);
                }
            }
        }
    }
    // -----------------------------------------------CARDS---------------------------------------------- //
    if (!user.bot) {
        for (var i = 0; i < rollCache.length; i++) {
            if (reaction.message == rollCache[i][0] ) {
                let optionIndex = getOptionIndexFromCardIndex(rollCache[i][2], cards[rollCache[i][1]]);
                let cardIs = cards[rollCache[i][1]][optionIndex];
                if (reaction.emoji.name == "💰") {
                    if (!cardIs[2]) {
                        if (updateBal(user.username) >= cardIs[3]) {
                            if (updateData(user.username, "buys") > 0) {
                                cardIs[2] = user.username;
                                reaction.message.channel.send(user.username + " compró " + capFirst(rollCache[i][1]) + " #" + (rollCache[i][2] + 1) + " por $" + cardIs[3] + "!");
                                users[user.username]["col"][rollCache[i][1]].splice(indexOfCorrectInsertion(rollCache[i][2], users[user.username]["col"][rollCache[i][1]]), 0, rollCache[i][2]);
                                let updatedCard = getCardEmbed(optionIndex, rollCache[i][1]);
                                reaction.message.edit(updatedCard);
                                removeMoney(user.username, cardIs[3]);
                                removeOne(user.username, "buys");
                            } else {
                                reaction.message.channel.send("No te quedan compras");
                            }
                        } else {
                            reaction.message.channel.send("No tenés suficiente plata");
                        }
                    } else {
                        reaction.message.channel.send("La carta ya tiene dueño");
                    }
                } else if (coolReactions.includes(reaction.emoji.name)) {
                    if (updateData(user.username, "reacts") > 0) {
                        if (cardIs[2]) {
                            rollCache[i][3].push(cardIs[2]);
                        }
                        if (!rollCache[i][3].includes(user.username)) {
                            reaction.message.channel.send(user.username + " ganó $" + cardIs[3]/2 + " reaccionando a " + capFirst(rollCache[i][1]) + " #" + (rollCache[i][2] + 1));
                            if (cardIs[2]) {
                                reaction.message.channel.send(cardIs[2] + " ganó $" + cardIs[3]*cardIs[4] + " por ser el dueño de la carta");
                                removeMoney(cardIs[2], -cardIs[3]*cardIs[4]);
                            }
                            rollCache[i][3].push(user.username);
                            removeOne(user.username, "reacts");
                            removeMoney(user.username, -cardIs[3]/2);
                        }
                    } else {
                        reaction.message.channel.send("No te quedan reacciones");
                    }
                }
                break;
            }
        }
    }
}
// GET IMAGES
async function saveGifsToCards(amount, search, cmd, msg, main) {
    let json;
    if (amount < 1) {
        amount = 1;
    } else if (amount > 50) {
        amount = 50;
    }
    let url = "https://api.tenor.com/v1/search?q=" + search + "&key=" + process.env.TENOR_KEY + "&limit=" + amount;
    console.log("Requesting gifs from Tenor...");
    lastMsg = await msg.channel.send("Agregando " + amount + " gifs al comando `" + main + "`...");
    request(url, function(error, response, body) {
        if (!error && response.statusCode == 200) {
            json = JSON.parse(body);
            for (var i = 0; i < json["results"].length; i++) {
                cards[cmd].push([json["results"][i]["media"][0]["gif"]["url"], "gif", "", 0, 1, 0, ""]);
            }
        }
        console.log("Saved " + amount + " gifs");
        lastMsg.edit("Agregando " + amount + " gifs al comando `" + main + "`... Listo");
        thereWasChange = true;
    });
}
async function saveImgsToCards(amount, search, cmd, msg, main) {
    let json;
    if (amount < 1) {
        amount = 1;
    } else if (amount > 50) {
        amount = 50;
    }
    let options = {
        url: "http://results.dogpile.com/serp?qc=images&q=" + search,
        method: "GET",
        headers: {
            "Accept": "text/html",
            "User-Agent": "Chrome"
        }
    };
    console.log("Requesting images from Dogpile...");
    lastMsg = await msg.channel.send("Agregando " + amount + " imágenes al comando `" + main + "`...");
    request(options, async function(error, response, body) {
        if (!error && response.statusCode == 200) {
            $ = await cheerio.load(body);
            var links = $(".image a.link");
            var urls = [];
            for (var i = 0; i < amount; i++) {
                cards[cmd].push([links.eq(i).attr("href"), "img", "", 0, 1, 0, ""]);
            }
        }
        console.log("Saved " + amount + " images");
        lastMsg.edit("Agregando " + amount + " imágenes al comando `" + main + "`... Listo");
        thereWasChange = true;
    });
}
async function getGif(string, main) {
    let json;
    let splitString = string.split("-");
    let id = splitString[splitString.length - 1];
    let url = "https://api.tenor.com/v1/gifs?ids=" + id + "&key=" + process.env.TENOR_KEY;
    console.log("Requesting a gif from Tenor...");
    request(url, function(error, response, body) {
        if (!error && response.statusCode == 200) {
            json = JSON.parse(body);
            cards[main].push([json["results"][0]["media"][0]["gif"]["url"], "gif", "", 0, 1, 0, ""]);
        }
        console.log("Saved 1 gif");
    });
}
// CARDS
function cardsInCommand(command) {
    let ans = 0;
    for (var i = 0; i < command.length; i++) {
        if (command[i][1] !== "txt") {
            ans++;
        }
    }
    return ans;
}
function gifsInCommand(command) {
    let ans = 0;
    for (var i = 0; i < command.length; i++) {
        if (command[i][1] == "gif") {
            ans++;
        }
    }
    return ans;
}
function getCardIndexFromOptionIndex(optionIndex, command) {
    let ans = optionIndex;
    for (var i = 0; i < optionIndex; i++) {
        if (command[i][1] == "txt") {
            ans--;
        }
    }
    return ans;
}
function getOptionIndexFromCardIndex(cardIndex, command) {
    let ans = cardIndex;
    let cardsCounted = 0;
    for (var i = 0; i < command.length; i++) {
        if (command[i][1] == "txt") {
            ans++;
        } else {
            if (cardsCounted == cardIndex) {
                break;
            }
            cardsCounted++;
        }
    }
    return ans;
}
function getCardEmbed(optionIndex, collection) {
    let array = cards[collection];
    let ownerIs = "-";
    if (array[optionIndex][2]) {
        ownerIs = array[optionIndex][2];
    }
    let extraName = "";
    if (array[optionIndex][5]) {
        extraName = " - " + array[optionIndex][5];
    }
    let ans = new Discord.MessageEmbed()
        .setColor(toRgb(array[optionIndex][3]))
        .setTitle(capFirst(collection) + " #" + (getCardIndexFromOptionIndex(optionIndex, array) + 1) + extraName)
        .addFields(
            { name: "Dueño", value: ownerIs, inline: true },
            { name: "Valor", value: "$" + array[optionIndex][3], inline: true },
            { name: "Multiplicador", value: "x" + array[optionIndex][4], inline: true }
        )
        .setImage(array[optionIndex][0])
        .setFooter((getCardIndexFromOptionIndex(optionIndex, array) + 1) + "/" + cardsInCommand(array) + " - id: " + collection + " " + (optionIndex + 1));
    return ans;
}
function findMaximumValue() {
    let ans = 100;
    for (key in cards) {
        if (key == "name") {
            continue;
        }
        for (var i = 0; i < cards[key].length; i++) {
            if (cards[key][i][3] > ans) {
                ans = cards[key][i][3];
            }
        }
    }
    maxValue = ans;
}
function getTop() {
    let ans = [];
    for (coll in cards) {
        if (coll == "name") {
            continue;
        }
        for (var i = 0; i < cards[coll].length; i++) {
            if (cards[coll][1] !== "txt") {
                for (var j = 0; j <= ans.length; j++) {
                    if (j == ans.length) {
                        ans.push([coll, i, cards[coll][i][3]]);
                        break;
                    } else if (cards[coll][i][3] > ans[j][2]) {
                        ans.splice(j, 0, [coll, i, cards[coll][i][3]]);
                        break;
                    }
                }
            }
        }
    }
    return ans;
}
// USERS
function collectionInfo(username) {
    let ans = [];
    let userCollection = users[username]["col"];
    let actualTotal = 0;
    let totalAmount = 0;
    let passiveIncome = 0;
    for (coll in userCollection) {
        if (userCollection[coll].length == 0) {
            continue;
        }
        let totalValue = 0;
        for (var i = 0; i < userCollection[coll].length; i++) {
            totalValue += cards[coll][getOptionIndexFromCardIndex(userCollection[coll][i], cards[coll])][3];
        }
        let miniPassive = totalValue / 10;
        if (userCollection[coll].length == cardsInCommand(cards[coll])) {
            miniPassive *= 2;
        }
        passiveIncome += miniPassive;
        ans.push([capFirst(coll), userCollection[coll].length, cardsInCommand(cards[coll]), totalValue, Math.round(totalValue/userCollection[coll].length), miniPassive]); // 0nameOfCollection, 1cardsOwned, 2totalCards, 3totalValue, 4averageValue, 5passiveIncome
        actualTotal += totalValue;
        totalAmount += userCollection[coll].length;
    }
    ans.push( [ totalAmount, actualTotal, 0, passiveIncome ] );
    if (totalAmount > 0) {
        ans[ans.length-1][2] = Math.round(actualTotal / totalAmount);
    }
    return ans;
}
function updateCollections(deletedCards, collection) {
    for (var userPerson in users) {
        if (userPerson == "name") {
            continue;
        }
        for (var i = 0; i < deletedCards.length; i++) {
            let startFrom = indexOfCorrectInsertion(deletedCards[i][1], users[userPerson]["col"][collection]);
            for (var j = startFrom; j < users[userPerson]["col"][collection].length; j++) {
                users[userPerson]["col"][collection][j]--;
            }
        }
    }
}
function indexOfCorrectInsertion(value, array) {
    let ans = 0;
    for (var i = 0; i < array.length; i++) {
        if (value > array[i]) {
            ans = i + 1;
        }
    }
    return ans;
}
async function getUserEmbed(username, guild) {
    updateBal(username);
    let userInfo = collectionInfo(username, guild);
    let toDisplayCollection = "No tiene cartas";
    let toDisplayTotal = "No tiene cartas";
    let toDisplayValue = "No tiene cartas";
    if (userInfo.length > 1) {
        toDisplayCollection = "";
        for (var i = 0; i < userInfo.length - 1; i++) {
            toDisplayCollection += userInfo[i][0] + ": " + userInfo[i][1] + "/" + userInfo[i][2] + "\n";
        }
        toDisplayTotal = userInfo[userInfo.length-1][0] + " cartas";
        toDisplayValue = "Total: $" + userInfo[userInfo.length-1][1] + "\nPromedio: $" + userInfo[userInfo.length-1][2];
    }
    let userObject = await client.users.fetch(getIdFromUsername(username));
    let toDisplayColor = "#000000";
    let toDisplayName = username;
    let memberObject;
    try {
        memberObject = guild.member(userObject);
        toDisplayColor = memberObject.displayHexColor;
        toDisplayName = memberObject.nickname;
    } catch(error) {
        console.log("Could not fetch memberObject");
    }
    let ans = new Discord.MessageEmbed()
        .setFooter("id: " + username)
        .setTitle(toDisplayName)
        .setThumbnail(userObject.avatarURL())
        .setColor(toDisplayColor)
        .addFields(
            { name: "Colección", value: toDisplayCollection, inline: true },
            { name: "Valor", value: toDisplayValue, inline: true },
            { name: "Cantidad total", value: toDisplayTotal, inline: true },
            { name: "Balance", value: "$" + Math.floor(users[username]["bal"][0]), inline: true },
            { name: "Ingresos pasivos", value: "$" + userInfo[userInfo.length-1][3] + "/día", inline: true },
            { name: "Compras disp.", value: updateData(username, "buys"), inline: true },
            { name: "Rolls disp.", value: updateData(username, "rolls"), inline: true },
            { name: "Inversiones disp.", value: updateData(username, "invs") , inline: true },
            { name: "Reacciones disp.", value: updateData(username, "reacts"), inline: true }
        );
    return ans;
}
function getIdFromUsername(username) {
    switch(username) {
        case "Zokalyx":
            return "284696251566391296";
        case "GonzaSch":
            return "260497285711003648";
        case "fatulina":
            return "572962195433062441";
        case "Lukitas":
            return "333027390622138369";
        case "vNicki":
            return "493066145843380226";
    }
}
function updateData(username, data) {
    users[username][data][0] += rates[data]*(Date.now() - users[username][data][1])/86400000;
    users[username][data][1] = Date.now();
    if (users[username][data][0] > 2*rates[data]) {
        users[username][data][0] = 2*rates[data];
    }
    return Math.floor(users[username][data][0]);
}
function updateBal(username) {
    users[username]["bal"][2] = collectionInfo(username)[collectionInfo(username).length-1][3];
    users[username]["bal"][0] += users[username]["bal"][2]*(Date.now() - users[username]["bal"][1])/86400000;
    users[username]["bal"][1] = Date.now();
    return Math.floor(users[username]["bal"][0]);
}
function updateAllBal() {
    for (us in users) {
        if (us == "name") {
            continue;
        }
        updateBal(us);
    }
}
function removeOne(username, data) {

    users[username][data][0]--;
}
function removeMoney(username, amount) {

    users[username]["bal"][0] -= amount;
}
// AUXILIARY
function listAll(array) {
    let ans = "";
    for (var i = 0; i < array.length; i++) {
        ans += array[i];
        if (i !== array.length - 1) {
            ans += "\n";
        }
    }
    return ans;
}
function joinWords(array) {
    let ans = "";
    for (var i = 0; i < array.length; i++) {
        ans += array[i]
        if (i !== array.length - 1) {
            ans += " ";
        }
    }
    return ans;
}
function recognizeType(entry) {
    let ans = "txt";
    if (entry.indexOf(" ") < 0 && entry.startsWith("http")) {
        if (entry.endsWith("gif")) {
            ans = "gif";
        } else {
            ans = "img";
        }
    }
    return ans;
}
function capFirst(string) {

    return (string.charAt(0).toUpperCase() + string.slice(1));
}
function toRgb(value) {
    let value1 = (value/maxValue * 360 - 50) % 360;
    if (value1 < 0) {
        value1 += 360;
    }
    let value2 = value/maxValue * 120;
    if (value2 > 100) {
        value2 = 100;
    }
    return convert.hsv.rgb(value1, value2, value2);
}
function selectRandomCard() {
    let ans;
    let cardsInEach = {};
    let total = 0;
    for (var card in cards) {
        if (card == "name") {
            continue;
        }
        cardsInEach[card] = cardsInCommand(cards[card]);
        total += cardsInCommand(cards[card]);
    }
    let preAns = Math.floor(Math.random() * total);
    let stepsTaken = 0;
    let found = false;
    for (var card in cardsInEach) {
        for (var i = 0; i < cardsInEach[card]; i++) {
            if (stepsTaken == preAns) {
                ans = [card, i];
                found = true;
                break;
            }
            stepsTaken++;
        }
        if (found) {
            break;
        }
    }
    return ans;
}

// --------------------------------------------------DISCORD EVENTS-----------------------------------------------------
// MESSAGES
client.on("message", async msg => {
    thereWasChange = true;
    let body = msg.content;
    if (body.startsWith(config["prefix"]) && body.length > config["prefix"].length) {
        let words = body.split(" ");
        let main = words[0].substring(config["prefix"].length);
        let response = "";
        switch(main) {
            // -----------------------------------------HELP----------------------------------------- //
            case "h":
            case "help":
                response += "**Lista de comandos disponibles:**\n";
                response += "`" + config["prefix"] + "` indica el comienzo de un comando\n";
                response += listAll(helpMsg);
                break;
            // -----------------------------------------NEW----------------------------------------- //
            case "new":
                response += "**Lista de últimos comandos agregados:**\n";
                for (var i = 0; i < newMsg.length; i++) {
                    response += newMsg[i];
                    if (i !== newMsg.length - 1) {
                        response += "\n";
                    }
                }
                break;
            // -----------------------------------------RESET----------------------------------------- //
            case "reset":
                lastMsg = await msg.channel.send("Reiniciando...");
                await reset();
                lastMsg.edit("Reiniciando... Listo");
                break;
            // -----------------------------------------PREFIX----------------------------------------- //
            case "prefix":
                if (words.length == 1) {
                    response += "Uso correcto: `prefix <prefijo>` cambia el prefijo de los comandos";
                } else {
                    config["prefix"] = words[1];
                    thereWasChange = true;
                    updatePresence();
                    response += "El prefijo para comandos ahora es `" + words[1] + "`";
                }
                break;
            // ------------------------------------------SAVE------------------------------------------ //
            case "save":
                console.log("Saving due to user input...");
                lastMsg = await msg.channel.send("Guardando datos...");
                await fileAll("w");
                lastMsg.edit("Guardando datos... Listo");
                break;
            // ------------------------------------------COL------------------------------------------ //
            case "col":
                if (words.length == 1) {
                    response += "**Colección de " + msg.author.username + ":**\n";
                    let collInfo = collectionInfo(msg.author.username);
                    for (var i = 0; i < collInfo.length - 1; i++) {
                        response += "**" + collInfo[i][0] + ":** " + collInfo[i][1] + "/" + collInfo[i][2] + " cartas coleccionadas - Valor total: $" + collInfo[i][3] + " - Valor promedio: $" + collInfo[i][4] + " - Ingresos pasivos: $" + collInfo[i][5] + "/día\n";
                    }
                    let lastRow = collInfo[collInfo.length-1];
                    response += "Total de cartas: " + lastRow[0] + " - Valor total: $" + lastRow[1] + " - Valor promedio: $" + lastRow[2] + " - Ingresos pasivos: $" + lastRow[3] + "/día";
                } else if (words[1] in cards && words[1] !== "name") {
                    response += "**Cartas de " + msg.author.username + " de la colección " + words[1] + ":**\n";
                    let toUserCollection = users[msg.author.username]["col"][words[1]];
                    if (toUserCollection.length == 0) {
                        response += "No tiene ninguna";
                    } else {
                        for (var i = 0; i < toUserCollection.length; i++) {
                            let specificCard = cards[words[1]][getOptionIndexFromCardIndex(toUserCollection[i], cards[words[1]])];
                            response += "#" + (toUserCollection[i] + 1) + " - Valor: $" + specificCard[3] + " - Multiplicador: x" + specificCard[4] + "\n";
                        }
                    }
                } else {
                    response += "No existe esa colección";
                }
                break;
            // ------------------------------------------GIVE------------------------------------------ //
            case "give":
            case "gift":
                if (words.length == 1) {
                    response += "Uso correcto: `give <usuario> <plata>` o `give <usuario> <colección> <número>`";
                } else {
                    if (words[1] in users && words[1] !== "name") {
                        if (words.length == 2) {
                            response += "Uso correcto: `give <usuario> <plata>` o `give <usuario> <colección> <número>`";
                        } else {
                            if (isNaN(words[2])) {
                                if (words.length == 3) {
                                    response += "Uso correcto: `give <usuario> <colección> <número>`";
                                } else {
                                    if (words[2] in cards && words[2] !== "name") {
                                        if (isNaN(words[3])) {
                                            response += "Uso correcto: `give <usuario> <colección> <número>`";
                                        } else {
                                            if (users[msg.author.username]["col"][words[2]].includes(words[3]-1)) {
                                                response += msg.author.username + " le dió " + capFirst(words[2]) + " #" + words[3] + " a " + words[1] + "!";
                                                cards[words[2]][getOptionIndexFromCardIndex(words[3]-1, cards[words[2]])][2] = words[1];
                                            } else {
                                                response += "No sos el dueño de esa carta";
                                            }
                                        }
                                    } else {
                                        response += "No existe la colección " + capFirst(words[2]);
                                    }
                                }
                            } else {
                                if (words[2] < 0) {
                                    response += "Valor mínimo = $0";
                                } else {
                                    if (updateBal(msg.author.username) >= words[2]) {
                                        response += msg.author.username + " le dió $" + words[2] + " a " + words[1] + "!";
                                        removeMoney(msg.author.username, words[2]);
                                        removeMoney(words[1], -words[2]);
                                    } else {
                                        response += "No tenés suficiente plata";
                                    }
                                }
                            }
                        }
                    } else {
                        response += "El usuario no existe. Ver `user list` para saber los IDs";
                    }
                }
                break;
            // ------------------------------------------BAL------------------------------------------ //
            case "bal":
                if (words.length == 1) {
                    updateBal(msg.author.username);
                    response += "El usuario " + msg.author.username + " tiene $" + users[msg.author.username]["bal"][0];
                } else if (words[1] in users) {
                    updateBal(words[1]);
                    response += "El usuario " + words[1] + " tiene $" + users[words[1]]["bal"][0];
                } else {
                    response += "No existe ese usuario";
                }
                break;
            // ------------------------------------------USER------------------------------------------ //
            case "user":
            case "u":
                if (words.length == 1) {
                    let toDisplayUser = await getUserEmbed(msg.author.username, msg.member.guild);
                    msg.channel.send(toDisplayUser);
                } else if (words[1] == "list") {
                    response += "**Lista de usuarios:**\n";
                    let userList = ["Zokalyx" , "fatulina", "Lukitas", "GonzaSch", "vNicki"];
                    for (var i = 0; i < userList.length; i++) {
                        response += userList[i] + " - $" + updateBal(userList[i]) + " - " + collectionInfo(userList[i])[collectionInfo(userList[i]).length-1][0] + " cartas\n";
                    }
                } else if (words[1] in users) {
                    let toDisplayUser = await getUserEmbed(words[1], msg.member.guild);
                    msg.channel.send(toDisplayUser);
                } else {
                    response += "No existe ese usuario, ver `user list` para ver los IDs";
                }
                break;
            // ------------------------------------------BUYS------------------------------------------ //
            case "buys":
                if (words.length == 1) {
                    updateData(msg.author.username, "buys");
                    response += "El usuario " + msg.author.username + " tiene " + users[msg.author.username]["buys"][0] + " compras disponibles";
                } else if (words[1] in users) {
                    updateData(words[1], "buys");
                    response += "El usuario " + words[1] + " tiene " + users[words[1]]["buys"][0] + " compras disponibles";
                } else {
                    response += "No existe ese usuario";
                }
                break;
            // ------------------------------------------ROLLS------------------------------------------ //
            case "rolls":
                if (words.length == 1) {
                    updateData(msg.author.username, "rolls");
                    response += "El usuario " + msg.author.username + " tiene " + users[msg.author.username]["rolls"][0] + " rolls disponibles";
                } else if (words[1] in users) {
                    updateData(words[1], "rolls");
                    response += "El usuario " + words[1] + " tiene " + users[words[1]]["rolls"][0] + " rolls disponibles";
                } else {
                    response += "No existe ese usuario";
                }
                break;
            // ------------------------------------------INVS------------------------------------------ //
            case "invs":
                if (words.length == 1) {
                    updateData(msg.author.username, "invs");
                    response += "El usuario " + msg.author.username + " tiene " + users[msg.author.username]["invs"][0] + " inversiones disponibles";
                } else if (words[1] in users) {
                    updateData(words[1], "invs");
                    response += "El usuario " + words[1] + " tiene " + users[words[1]]["invs"][0] + " inversiones disponibles";
                } else {
                    response += "No existe ese usuario";
                }
                break;
            // ------------------------------------------REACTS------------------------------------------ //
            case "reacts":
                if (words.length == 1) {
                    updateData(msg.author.username, "reacts");
                    response += "El usuario " + msg.author.username + " tiene " + users[msg.author.username]["reacts"][0] + " reacciones disponibles";
                } else if (words[1] in users) {
                    updateData(words[1], "reacts");
                    response += "El usuario " + words[1] + " tiene " + users[words[1]]["reacts"][0] + " reacciones disponibles";
                } else {
                    response += "No existe ese usuario";
                }
                break;
            // ------------------------------------------ROLL------------------------------------------ //
            case "r":
            case "roll":
            if (updateData(msg.author.username, "rolls") > 0) {
                let randomResult = selectRandomCard();
                currentView = [randomResult[0], randomResult[1]];
                lastOptionIndex = getOptionIndexFromCardIndex(randomResult[1], cards[randomResult[0]]);
                cards[randomResult[0]][lastOptionIndex][3] += baseCardValue;
                if (cards[randomResult[0]][lastOptionIndex][1] == "gif") {
                    cards[randomResult[0]][lastOptionIndex][3] += baseCardValue;
                }
                if (cards[randomResult[0]][lastOptionIndex][3] > maxValue) {
                    maxValue = cards[randomResult[0]][lastOptionIndex][3];
                }
                let cardToShow = getCardEmbed( lastOptionIndex, randomResult[0]);
                rollCache[currentRollCacheIndex] = [await msg.channel.send(cardToShow), randomResult[0], randomResult[1], []];
                rollCache[currentRollCacheIndex][0].react(coolReactions[Math.floor(Math.random()*coolReactions.length)]);
                if ( !cards[ randomResult[0] ][ lastOptionIndex ][2]) {
                    rollCache[currentRollCacheIndex][0].react("💰");
                }
                currentRollCacheIndex++;
                if (currentRollCacheIndex > maxRollCache) {
                    currentRollCacheIndex = 0;
                }
                if (cards[randomResult[0]][lastOptionIndex][2]) {
                    removeMoney(cards[randomResult[0]][lastOptionIndex][2], -cards[randomResult[0]][lastOptionIndex][3]*cards[randomResult[0]][lastOptionIndex][4]);
                    response += cards[randomResult[0]][lastOptionIndex][2] + " ganó $" + cards[randomResult[0]][lastOptionIndex][3]*cards[randomResult[0]][lastOptionIndex][4] + " por ser el dueño de la carta";
                }
                removeOne(msg.author.username, "rolls");
            } else {
                response += "No te quedan rolls";
            }
                break;
            // ------------------------------------------NEXT------------------------------------------ //
            case "n":
            case "next":
                if (currentlyViewingCard) {
                    currentView[1]++;
                    if (currentView[1] >= cardsInCommand(cards[currentView[0]])) {
                        currentView[1] = 0;
                    }
                    let cardToShow = getCardEmbed(getOptionIndexFromCardIndex(currentView[1], cards[currentView[0]]), currentView[0]);
                    msg.channel.send(cardToShow);
                } else {
                    response += "Comando no disponible";
                }
                break;
            // ------------------------------------------PREV------------------------------------------ //
            case "p":
            case "prev":
                if (currentlyViewingCard) {
                    currentView[1]--;
                    if (currentView[1] < 0) {
                        currentView[1] = cardsInCommand(cards[currentView[0]]) - 1;
                    }
                    let cardToShow = getCardEmbed(getOptionIndexFromCardIndex(currentView[1], cards[currentView[0]]), currentView[0]);
                    msg.channel.send(cardToShow);
                } else {
                    response += "Comando no disponible";
                }
                break;
            // ------------------------------------------GAME------------------------------------------ //
            case "game":
                if (words.length == 1) {
                    response += "**Lista de minijuegos disponibles:**\n";
                    response += listAll(miniGameMsg);
                } else {
                    if (words[1] == "connect4") {
                        let width = 10;
                        let height = 10;
                        let parameterError = false;
                        if (words.length > 2) {
                            let dims = words[2].split("x");
                            if (dims.length == 2) {
                                if (!isNaN(dims[0]) && !isNaN(dims[1])) {
                                    width = dims[0];
                                    height = dims[0];
                                    if (width > 10) {
                                        width = 10;
                                    } else if (width < 1) {
                                        width = 1;
                                    }
                                    if (height > 10) {
                                        height = 10;
                                    } else if (height < 1) {
                                        height = 1;
                                    }
                                } else {
                                    response += "Uso correcto: `connect4 (<anchura>x<altura>)` inicia una partida de 4 en línea, con un tablero del tamaño seleccionado (default = 10x10)";
                                    parameterError = true;
                                }
                            }
                        }
                        if (!parameterError) {
                            game = new C4(width, height);
                            gameName = "c4";
                            board = new Discord.MessageEmbed().setDescription(game.renderBoard()).setTitle("4 en línea  -  :blue_circle: vs :red_circle:");
                            boardMsg = await msg.channel.send(board);
                            game.reactBoard(boardMsg);
                        }
                    }
                }
                break;
            // ------------------------------------------CARD------------------------------------------ //
            case "c":
            case "card":
                if (words.length < 2) {
                    response += "Uso correcto: `card <colección> <número>` muestra una carta específica de una colección";
                } else {
                    if (words[1] == "list") {
                        response += "**Colecciones:**\n";
                        for (var card in cards) {
                            if (card == "name") {
                                continue;
                            }
                            if (cardsInCommand(cards[card]) > 0) {
                                let totalValue = 0;
                                for (var i = 0; i < cards[card].length; i++) {
                                    totalValue += cards[card][i][3];
                                }
                                response += capFirst(card) + ": " + cardsInCommand(cards[card]) + " cartas (" + gifsInCommand(cards[card]) + " gifs y " + (cardsInCommand(cards[card]) - gifsInCommand(cards[card])) + " imágenes) - Valor total: $" + totalValue + " - Valor promedio: $" + Math.round(totalValue / cardsInCommand(cards[card])) + "\n";
                            }
                        }
                    } else if (words[1] == "help") {
                        response += "**Lista de comandos sobre cartas:**\n";
                        response += listAll(cardHelpMsg);
                    } else if (words[1] in cards && words[1] != "name" && words.length > 2) {
                        if (isNaN(words[2])) {
                            response += "Uso correcto: `card <colección> <número>` muestra una carta específica de una colección";
                        } else {
                            if (words[2] > cardsInCommand(cards[words[1]]) || words[2] < 1) {
                                response += "La colección " + capFirst(words[1]) + " no contiene carta #" + words[2];
                            } else {
                                if (words.length > 3 && words[3] == "rename") {
                                    if (words.length == 4) {
                                        response += "Uso correcto: `c <colección> <número> rename <nombre>` renombra una carta si es tuya";
                                    } else {
                                        if (cards[words[1]][getOptionIndexFromCardIndex(words[2]-1, cards[words[1]])][2] == msg.author.username) {
                                            response += capFirst(words[1]) + " #" + words[2] + ' ahora se llama "' + joinWords(words.slice(4)) + '"';
                                            cards[words[1]][getOptionIndexFromCardIndex(words[2]-1, cards[words[1]])][5] = joinWords(words.slice(4));
                                        } else {
                                            response += "Solo el dueño de una carta puede renombrarla";
                                        }
                                    }
                                }
                                let cardToShow = getCardEmbed(getOptionIndexFromCardIndex(words[2]-1, cards[words[1]]), words[1]);
                                msg.channel.send(cardToShow);
                                currentView = [words[1], words[2]-1];
                                currentlyViewingCard = true;
                            }
                        }
                    } else {
                        response += "No existe la colección " + capFirst(words[1]) + " o te falto indicar el número";
                    }
                }
                break;
            // ------------------------------------------INV------------------------------------------ //
            case "invest":
            case "inv":
                if (words.length < 2) {
                    response += "Uso correcto: `inv <colección> <número>` invierte plata en la carta";
                } else {
                    if (words[1] in cards && words[1] != "name" && words.length > 2) {
                        if (isNaN(words[2])) {
                            response += "Uso correcto: `inv <colección> <número>` invierte plata en la carta";
                        } else {
                            if (words[2] > cardsInCommand(cards[words[1]]) || words[2] < 1) {
                                response += "La colección " + capFirst(words[1]) + " no contiene carta #" + words[2];
                            } else {
                                if (users[msg.author.username]["col"][words[1]].includes(words[2]-1)) {
                                    if (updateData(msg.author.username, "invs") > 0) {
                                        if (updateBal(msg.author.username) >= cards[words[1]][getOptionIndexFromCardIndex(words[2]-1, cards[words[1]])][3]*cards[words[1]][getOptionIndexFromCardIndex(words[2]-1, cards[words[1]])][4]) {
                                            removeMoney(msg.author.username, cards[words[1]][getOptionIndexFromCardIndex(words[2]-1, cards[words[1]])][3]*cards[words[1]][getOptionIndexFromCardIndex(words[2]-1, cards[words[1]])][4]);
                                            response += msg.author.username + " invirtió $" + (cards[words[1]][getOptionIndexFromCardIndex(words[2]-1, cards[words[1]])][3]*cards[words[1]][getOptionIndexFromCardIndex(words[2]-1, cards[words[1]])][4]) + " en " + capFirst(words[1]) + " #" + words[2] + "! (Multiplicador nuevo: x" + (cards[words[1]][getOptionIndexFromCardIndex(words[2]-1, cards[words[1]])][4]+1) + ")";
                                            cards[words[1]][getOptionIndexFromCardIndex(words[2]-1, cards[words[1]])][4]++;
                                            removeOne(msg.author.username, "invs");

                                        } else {
                                            response += "No tenés suficiente dinero";
                                        }
                                    } else {
                                        response += "No te quedan inversiones";
                                    }
                                } else {
                                    response += "No sos el dueño de la carta " + capFirst(words[1]) + " #" + words[2];
                                }
                            }
                        }
                    } else {
                        response += "No existe la colección " + capFirst(words[1]) + " o te falto indicar el número";
                    }
                }
                break;
            // ------------------------------------------SELL------------------------------------------ //
            case "sell":
                if (words.length < 2) {
                    response += "Uso correcto: `sell <colección> <número>` vende una carta por la mitad de su valor";
                } else {
                    if (words[1] in cards && words[1] != "name" && words.length > 2) {
                        if (isNaN(words[2])) {
                            if (words[2] == "all") {
                                if (users[msg.author.username]["col"][words[1]].length > 0) {
                                    response += "**Vendiendo todas las cartas de " + words[1] + ":**\n";
                                    let totalEarnings = 0;
                                    for (var i = 0; i < users[msg.author.username]["col"][words[1]].length; i++) {
                                        response += "#" + (users[msg.author.username]["col"][words[1]][i] + 1) + " vendida por $" + cards[words[1]][getOptionIndexFromCardIndex(users[msg.author.username]["col"][words[1]][i], cards[words[1]])][3]/2 + "\n";
                                        totalEarnings += cards[words[1]][getOptionIndexFromCardIndex(users[msg.author.username]["col"][words[1]][i], cards[words[1]])][3]/2;
                                        cards[words[1]][getOptionIndexFromCardIndex(users[msg.author.username]["col"][words[1]][i], cards[words[1]])][2] = "";
                                    }
                                    users[msg.author.username]["col"][words[1]] = [];
                                    response += "**Total:** $" + totalEarnings;
                                } else {
                                    response += "No tenés cartas de la colección " + capFirst(words[1]);
                                }
                            } else {
                                response += "Uso correcto: `sell <colección> <número>` vende una carta por la mitad de su valor";
                            }
                        } else {
                            if (words[2] > cardsInCommand(cards[words[1]]) || words[2] < 1) {
                                response += "La colección " + capFirst(words[1]) + " no contiene carta #" + words[2];
                            } else {
                                if (users[msg.author.username]["col"][words[1]].includes(words[2]-1)) {
                                    response += msg.author.username + " vendió " + capFirst(words[1]) + " #" + words[2] + " por $" + (cards[words[1]][getOptionIndexFromCardIndex(words[2]-1, cards[words[1]])][3]/2);
                                    users[msg.author.username]["col"][words[1]].splice(users[msg.author.username]["col"][words[1]].indexOf(words[2]-1), 1);
                                    cards[words[1]][getOptionIndexFromCardIndex(words[2]-1, cards[words[1]])][2] = "";
                                    removeMoney(msg.author.username, -cards[words[1]][getOptionIndexFromCardIndex(words[2]-1, cards[words[1]])][3]/2);
                                } else {
                                    response += "No sos el dueño de la carta " + capFirst(words[1]) + " #" + words[2];
                                }
                            }
                        }
                    } else {
                        response += "No existe la colección " + capFirst(words[1]) + " o te falto indicar el número";
                    }
                }
                break;
            // ------------------------------------------EXIT------------------------------------------ //
            case "exit":
                console.log("Shutting down due to user input...");
                lastMsg = await msg.channel.send("I'll be back...");
                setTimeout(async function() {
                    await lastMsg.edit("I'll be back... b");
                    await lastMsg.edit("I'll be back... bi");
                    await lastMsg.edit("I'll be back... bit");
                    await lastMsg.edit("I'll be back... bitc");
                    await lastMsg.edit("I'll be back... bitch");
                    process.exit();
                }, 500);
                break;
            // ------------------------------------------LIST------------------------------------------ //
            case "lista":
            case "list":
                if (words.length > 1) {
                    response += "**Lista de subcomandos disponibles:**\n";
                    response += listAll(helpListMsg);
                } else {
                    response += "**Lista de comandos personalizados disponibles:**\n";
                    for (var card in cards) {
                        if (card !== "name") {
                            response += "`" + card + "` con " + cards[card].length + " opciones\n";
                        }
                    }
                }
                break;
            // ------------------------------------------(+)-------------------------------------------- //
            case "+":
                if (words.length == 1) {
                    response += "Uso correcto: `+ <cmd>` agrega un comando personalizado";
                } else if (words[1] == "name") {
                    response += "No se permite la creación del comando `name`";
                } else {
                    if (words[1] in cards) {
                        response += "El comando `"+ words[1] + "` ya existe";
                    } else {
                        cards[words[1]] = [];
                        thereWasChange = true;
                        response += "Comando personalizado `" + words[1] + "` agregado";
                        for (var userPerson in users) {
                            if (userPerson == "name") {
                                continue;
                            }
                            users[userPerson]["col"][words[1]] = [];
                        }
                    }
                }
                break;
            // ------------------------------------------(-)-------------------------------------------- //
            case "-":
                if (words.length == 1) {
                    response += "Uso correcto: `- <cmd>` remueve un comando personalizado";
                } else if (words[1] == "name") {
                    response += "El comando `name` no existe";
                } else {
                    if (words[1] in cards) {
                        delete cards[words[1]];
                        thereWasChange = true;
                        response += "Comando personalizado `"+ words[1] + "` removido";
                        for (var userPerson in users) {
                            if (userPerson == "name") {
                                continue;
                            }
                            delete users[userPerson]["col"][words[1]];
                        }
                        if (currentView[0] == words[1]) {
                            currentlyViewingCard = false;
                        }
                    } else {
                        response += "El comando `" + words[1] + "` no existe";
                    }
                }
                break;
            // -----------------------------------------DEBUG------------------------------------------- //
            case "debug":
                if (msg.author.username == "Zokalyx") {
                    /*let usersss = ["Zokalyx", "GonzaSch", "fatulina", "Lukitas", "vNicki"];
                    let n = Date.now();
                    for (var i = 0; i < usersss.length; i++) {
                        users[usersss[i]] = {"bal":[0,n,0], "rolls": [24,n], "reacts": [12,n], "invs": [2,n], "buys": [6,n], "col": {}};
                    }
                    cards = {name: "cards"};*/
                    let commando = joinWords(words.slice(1));
                    console.log(commando);
                    try {
                        console.log("Evaluating (" + commando + ")...");
                        msg.channel.send(eval(commando));
                    } catch(error) {
                        msg.channel.send(error.message);
                        console.log("Error: " + error.message);
                    }
                }
                break;
            // -----------------------------------------STOP------------------------------------------- //
            case "stop":
                if (repeating) {
                    stopSpam = true;
                    await msg.channel.send("Ok");
                }
                break;
            // ------------------------------------------TOP------------------------------------------- //
            case "top":
                let listing = getTop();
                response += "**Lista de cartas más valiosas:**\n";
                for (var i = 0; i < 20; i++) {
                    response += "**" + (i + 1) + ":** " + capFirst(listing[i][0]) + " #" + (getCardIndexFromOptionIndex(listing[i][1], cards[listing[i][0]]) + 1) + " - Valor: $" + cards[listing[i][0]][listing[i][1]][3] + " - Multiplicador: x" + cards[listing[i][0]][listing[i][1]][4] + " - Dueño: " + cards[listing[i][0]][listing[i][1]][2] + "\n";
                }
                break;
            // ----------------------------------------REPEAT------------------------------------------- //
            case "repeat":
                if (words.length == 1) {
                    response += "Uso correcto: `repeat (<cantidad de veces>) <mensaje>` repite una cantidad de veces un mensaje (default = x1)";
                } else {
                    let multiplier = 1;
                    let toRepeat = "";
                    if (!isNaN(words[1])) {
                        multiplier = words[1];
                        if (multiplier < 1) {
                            multiplier = 1;
                        } else if (multiplier > 10) {
                            multiplier = 10;
                        }
                        if (words.length == 2) {
                            response += "Uso correcto: `repeat (<cantidad de veces>) <mensaje>` repite una cantidad de veces un mensaje (default = x1)";
                        } else {
                            toRepeat = joinWords(words.splice(2));
                        }
                    } else {
                        toRepeat = joinWords(words.splice(1));
                    }
                    if (toRepeat) {
                        repeating = true;
                        for (var i = 0; i < multiplier; i++) {
                            await msg.channel.send(toRepeat);
                            if (stopSpam) {
                                stopSpam = false;
                                break;
                            }
                        }
                        repeating = false;
                    }
                }
                break;
            // ----------------------------------------CUSTOM-------------------------------------------- //
            default:
                if (main == "name") {
                    response += "El comando `name` no existe";
                } else if (main in cards) {
                    if (words.length == 1) {
                        if (cards[main].length > 0) {
                            let ind = Math.floor(Math.random()*cards[main].length)
                            response += cards[main][ind][0];
                            lastOptionIndex = ind;
                        } else {
                            response += "El comando `" + main + "` no contiene opciones";
                        }
                    } else {
                        if (words[1] == "+") {
                            if (words.length == 2) {
                                response += "Uso correcto: ver `list help`";
                            } else {
                                //updateAllBal();
                                if (isNaN(words[2])) {
                                    let entry = joinWords(words.slice(2));
                                    let type = recognizeType(entry);
                                    let artificial1 = false;
                                    if (entry.includes("tenor") && entry.includes("gif") && !entry.endsWith(".gif")) {
                                        entry = await getGif(entry, main);
                                        type = "gif";
                                        artificial1 = true;
                                    } else {
                                        cards[main].push([entry, type, "", 0, 1, 0, ""]);
                                    }
                                    thereWasChange = true;
                                    if (type == "gif") {
                                        response += "Gif agregado";
                                    } else if (type == "img") {
                                        response += "Imagen agregada";
                                    } else {
                                        response += "Texto agregado";
                                    }
                                    if (artificial1) {
                                        response += " como opción número " + (cards[main].length + 1) + " del comando `" + main + "`";
                                    } else {
                                        response += " como opción número " + cards[main].length + " del comando `" + main + "`";
                                    }
                                } else {
                                    if (words.length == 3) {
                                        response += "Uso correcto: ver `list help`";
                                    } else {
                                        if (words[3] == "gifs" || words[3] == "gif") {
                                            let search = main;
                                            if (words.length > 4) {
                                                search = joinWords(words.slice(4));
                                            }
                                            saveGifsToCards(words[2], search, main, msg, main);
                                        } else if (words[3] == "imgs" || words[3] == "img") {
                                            let search = main;
                                            if (words.length > 4) {
                                                search = joinWords(words.slice(4));
                                            }
                                            saveImgsToCards(words[2], search, main, msg, main);
                                        } else {
                                            response += "Uso correcto: ver `list help`";
                                        }
                                    }
                                }
                            }
                        } else if (words[1] == "-") {
                            let deletedCards = [];
                            if (words.length == 2) {
                                let ind = cards[main].length - 1;
                                if (cards[main].length > 0) {
                                    if (owners([cards[main][ind]]).length > 0) {
                                        response += "La carta " + capFirst(main) + " #" + cards[main].length + " le pertenece a " + owners([cards[main][ind]])[0];
                                    } else {
                                        response += "Opción " + (cards[main].length) + " del comando `" + main + "` removida";
                                        if (cards[main][cards[main].length-1][1] !== "txt") {
                                            deletedCards.push([main, getCardIndexFromOptionIndex(cards[main].length-1, cards[main])]);
                                        }
                                        cards[main].pop();
                                        thereWasChange = true;
                                        if (cardsInCommand(cards[main]) == 0 && currentView[0] == main) {
                                            currentlyViewingCard = false;
                                        }
                                    }
                                } else {
                                    response += "El comando `" + main + "` no contiene opciones";
                                }
                            } else {
                                if (words[2] == "all") {
                                    if (cards[main].length > 0) {
                                        if (owners(cards[main]).length > 0) {
                                            response += "Hay cartas en la colección " + capFirst(main) + " que le pertenecen a:\n";
                                            response += listAll(owners(cards[main]));
                                        } else {
                                            response += "Todas (" + cards[main].length + ") las opciones de `" + main + "` removidas";
                                            for (var i = 0; i < cards[main].length; i++) {
                                                if (cards[main][i][1] !== "txt") {
                                                    deletedCards.push([main, getCardIndexFromOptionIndex(i, cards[main])]);
                                                }
                                            }
                                            cards[main] = [];
                                            thereWasChange = true;
                                        }
                                    } else {
                                    response += "`" + main + "` no contiene opciones";
                                    }
                                } else if (words[2] == "last") {
                                    if (lastOptionIndex >= 0) {
                                        let ind = lastOptionIndex;
                                        if (cards[main].length > 0) {
                                            if (owners([cards[main][ind]]).length > 0) {
                                                response += "La carta " + capFirst(main) + " #" + cards[main].length + " le pertenece a " + owners([cards[main][ind]])[0];
                                            } else {
                                                if (cards[main][lastOptionIndex][1] !== "txt") {
                                                    deletedCards.push([main, getCardIndexFromOptionIndex(lastOptionIndex, cards[main])]);
                                                }
                                                cards[main].splice(lastOptionIndex, 1);
                                                thereWasChange = true;
                                                response += "Opción " + (lastOptionIndex + 1) + " del comando `" + main + "` removida";
                                            }
                                        } else {
                                            response += "Comando no disponible";
                                        }
                                    } else {
                                        response += "Comando no disponible";
                                    }
                                } else if (!isNaN(words[2])) {
                                    if (words[2] > 0 && words[2] <= cards[main].length) {
                                        let ind = words[2]-1;
                                        if (cards[main].length > 0) {
                                            if (owners([cards[main][ind]]).length > 0) {
                                                response += "La carta " + capFirst(main) + " #" + (ind + 1) + " le pertenece a " + owners([cards[main][ind]])[0];
                                            } else {
                                                if (cards[main][words[2]-1][1] !== "txt") {
                                                    deletedCards.push([main, getCardIndexFromOptionIndex(words[2]-1, cards[main])]);
                                                }
                                                cards[main].splice(words[2]-1, 1);
                                                thereWasChange = true;
                                                response += "Opción " + words[2] + " del comando `" + main + "` removida";
                                            }
                                        }
                                    } else {
                                        response += "`" + main + "` no tiene opción número " + words[2];
                                    }
                                } else {
                                    response += "Uso correcto: ver `list help`";
                                }
                            }
                            updateCollections(deletedCards, main);
                            lastOptionIndex = -1;
                            rollCache = [];
                            currentRollCacheIndex = 0;
                        } else if (words[1] == "list") {
                            response += "**Lista de opciones del comando `" + main + "`:**\n";
                            let remaining = 0;
                            for (var i = 0; i < cards[main].length; i++) {
                                if (i == 20) {
                                    remaining = cards[main].length - 20;
                                    break;
                                }
                                response += (i + 1) + ": " + cards[main][i][0] + "\n";
                                response += (i + 1) + ": " + cards[main][i][0] + "\n";
                            }
                            if (remaining > 0) {
                                response += "(Y " + remaining + " más)";
                            }
                        } else if (!isNaN(words[1])) {
                            let ind = words[1] - 1;
                            if (ind < 0 || ind >= cards[main].length) {
                                response += "El comando `" + main + "` no tiene opción " + (ind + 1);
                            } else {
                                response += cards[main][ind][0];
                            }
                        } else {
                            response += "Uso correcto: ver `list help`";
                        }
                    }
                } else {
                    response += "El comando `" + main + "` no existe";
                }
        }
        // REPLY
        if (response) {
            msg.channel.send(response);
        }
    }
});
// REACTIONS
client.on("messageReactionAdd", manageReactions);
client.on("messageReactionRemove", manageReactions);

// -----------------------------------------------------MISC------------------------------------------------------------
// AUTOSAVE
setInterval(function() {
    if (thereWasChange) {
        console.log("Saving due to auto-save...");
        fileAll("w");
        thereWasChange = false;
    }
}, 300000);
// SET PRESENCE
setTimeout(updatePresence, 10000);

// --------------------------------------------------CLASSES------------------------------------------------------------
//GAMES
class C4 {
    constructor(w, h) {
        this.x = w;
        this.y = h;
        this.array = [];
        this.turn = 1;
        this.ended = false;
        this.winner = 0;
        this.a = "";
        this.b = "";
        for (var i = 0; i < this.x; i++) {
            this.array.push([]);
            for (var j = 0; j < this.y; j++) {
              this.array[i].push(0);
            }
        }
    }

    checkHorizontals() {
        var maxCounter = 0;
        for (var j = 0; j < this.y; j++) {
        var counter = 0;
        for (var i = 0; i < this.x; i++) {
          if (this.array[i][j] == 0 || 0 > this.array[i][j]*counter) {counter = 0;}
          counter += this.array[i][j]
          if (Math.abs(counter) == 4) {
            break;
          }
        }
        if (Math.abs(counter) > Math.abs(maxCounter)) {
          maxCounter = counter;
        }
        if (Math.abs(maxCounter) == 4) {
          break;
        }
        }
        return maxCounter;
    }

    checkVerticals() {
        var maxCounter = 0;
        for (var i = 0; i < this.x; i++) {
        var counter = 0;
        for (var j = 0; j < this.x; j++) {
          if (this.array[i][j] == 0 || 0 > this.array[i][j]*counter) {counter = 0;}
          counter += this.array[i][j]
          if (Math.abs(counter) == 4) {
            break;
          }
        }
        if (Math.abs(counter) > Math.abs(maxCounter)) {
          maxCounter = counter;
        }
        if (Math.abs(maxCounter) == 4) {
          break;
        }
        }
        return maxCounter;
    }

    checkDiagonal1a() {
        var maxCounter = 0;
        for (var i = 0; i < this.x - 3; i++) {
        var counter = 0;
        var aux = 0;
        while (true) {
          if (aux + i == this.x || aux == this.y) {
            break;
          }
          if (this.array[i + aux][aux] == 0 || 0 > this.array[i + aux][aux]*counter) {counter = 0;}
          counter += this.array[i + aux][aux];
          if (Math.abs(counter) == 4) {
            break;
          }
          aux++;
        }
        if (Math.abs(counter) > Math.abs(maxCounter)) {
          maxCounter = counter;
        }
        if (Math.abs(maxCounter) == 4) {
          break;
        }
        }
        return maxCounter;
    }

    checkDiagonal1b() {
        var maxCounter = 0;
        for (var j = 1; j < this.y - 3; j++) {
        var counter = 0;
        var aux = 0;
        while (true) {
          if (aux == this.x || aux + j == this.y) {
            break;
          }
          if (this.array[aux][j + aux] == 0 || 0 > this.array[aux][j + aux]*counter) {counter = 0;}
          counter += this.array[aux][j + aux];
          if (Math.abs(counter) == 4) {
            break;
          }
          aux++;
        }
        if (Math.abs(counter) > Math.abs(maxCounter)) {
          maxCounter = counter;
        }
        if (Math.abs(maxCounter) == 4) {
          break;
        }
        }
        return maxCounter;
    }

    checkDiagonal2a() {
        var maxCounter = 0;
        for (var i = this.x - 1; i > 2; i--) {
        var counter = 0;
        var aux = 0;
        while (true) {
          if (i - aux == -1 || aux == this.y) {
            break;
          }
          if (this.array[i - aux][aux] == 0 || 0 > this.array[i - aux][aux]*counter) {counter = 0;}
          counter += this.array[i - aux][aux];
          if (Math.abs(counter) == 4) {
            break;
          }
          aux++;
        }
        if (Math.abs(counter) > Math.abs(maxCounter)) {
          maxCounter = counter;
        }
        if (Math.abs(maxCounter) == 4) {
          break;
        }
        }
        return maxCounter;
    }

    checkDiagonal2b() {
        var maxCounter = 0;
        for (var j = 1; j < this.y; j++) {
        var counter = 0;
        var aux = 0;
        while (true) {
          if (this.x - 1 - aux == -1 || j + aux == this.y) {
            break;
          }
          if (this.array[this.x - 1 - aux][j + aux] == 0 || 0 > this.array[this.x - 1 - aux][j + aux]*counter) {counter = 0;}
          counter += this.array[this.x - 1 - aux][j + aux];
          if (Math.abs(counter) == 4) {
            break;
          }
          aux++;
        }
        if (Math.abs(counter) > Math.abs(maxCounter)) {
          maxCounter = counter;
        }
        if (Math.abs(maxCounter) == 4) {
          break;
        }
        }
        return maxCounter;
    }

    check() {
        if (this.checkHorizontals() == 4 || this.checkVerticals() == 4 || this.checkDiagonal1a() == 4 || this.checkDiagonal1b() == 4 || this.checkDiagonal2a() == 4 || this.checkDiagonal2b() == 4) {
        return 1;
        } else if (this.checkHorizontals() == -4 || this.checkVerticals() == -4 || this.checkDiagonal1a() == -4 || this.checkDiagonal1b() == -4 || this.checkDiagonal2a() == -4 || this.checkDiagonal2b() == -4) {
        return -1;
        } else {
        return 0;
        }
    }

    checkDraw() {
        var ans = true;
        for (var i = 0; i < this.x ; i++) {
            for (var j = 0; j < this.y ; j++) {
                if (this.array[i][j] == 0) {
                    ans = false;
                    break;
                }
            }
            if (!ans) {
                break;
            }
        }
        return ans;
    }

    renderBoard() {
        var ans = "";
        for (var j = this.y - 1; j >= 0; j--) {
            for (var i = 0; i < this.x; i++) {
                if (this.array[i][j] == 0) {
                    ans += ":black_circle:";
                } else if (this.array[i][j] == 1) {
                    ans += ":blue_square:";
                } else {
                    ans += ":red_square:";
                }
                if (i !== this.x - 1) {
                    ans += "    "
                }
            }
            ans += "\n\n"
        }
        return ans;
    }

    reactBoard(brd) {
        for (var i = 0; i < this.x; i++) {
            brd.react(regionalIndicators[i]);
        }
    }

    lowestBlank(col) {
      var row = -1;
      for (var j = 0; j < this.y; j++) {
        if (this.array[col][j] === 0) {
          row = j;
          break;
        }
      }
      return row;
    }

    act(col) {
        if (this.lowestBlank(col) >= 0) {
            this.array[col][this.lowestBlank(col)] = this.turn;
            this.turn *= -1;
        }
        if (this.check() !== 0) {
            this.ended = true;
            if (this.check() == 1) {
                this.winner = 1;
            } else {
                this.winner = -1;
            }
        }
        if (this.checkDraw()) {
            this.ended = true;
        }
    }

    renderTitle() {
        var ans = "4 en línea";
        ans += "  -  :blue_circle: ";
        ans += this.a;
        ans += " vs "
        ans += this.b;
        ans += " :red_circle:"
        if (this.ended) {
            ans += "  -  ";
            if (this.winner == 1) {
                ans += this.a + " ganó!"
            } else if (this.winner == -1) {
                ans += this.b + " ganó!"
            } else {
                ans += "Empate"
            }
        } else {
            if (this.turn == 1) {
                if (this.a !== "") {
                    ans += "  -  Turno de " + this.a + " :blue_circle:";
                }
            } else {
                if (this.b !== "") {
                    ans += "  -  Turno de " + this.b + " :red_circle:";
                }
            }
        }
        return ans;
    }
}