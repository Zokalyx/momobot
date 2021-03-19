// --------------------------------------------------IMPORTS------------------------------------------------------------
// BASIC
const Discord = require("discord.js"); // discord
const { Pool } = require("pg"); // database
require("dotenv").config(); // .env
require("console-stamp")(console, "HH:MM:ss"); // timestamps

// Fix for long fetching of members;
let intents = new Discord.Intents(Discord.Intents.NON_PRIVILEGED);
intents.add("GUILD_MEMBERS");

// CUSTOM
const keepAlive = require('./server'); // keeping a web server
const DatabaseFunctions = require("./database"); // database functions
const DiscordFunctions = require("./discordia"); // discord basic functions
const Main = require("./main"); // main command handler


// ------------------------------------------------BASE OBJECTS---------------------------------------------------------
const pool = new Pool({ // database pool
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});
const client = new Discord.Client( { ws: {intents: intents} } ); // set up the discord object


// ------------------------------------------------GLOBAL VARIABLES----------------------------------------------------
let cards = {name:"cards"}; // { ... command: [ [ 0content, 1type, 2owner, 3value, 4multiplier, 5name], ... ] }
let config = {name:"config"}; // { ... prefix: prefix, baseCardValue: x, rates: {reacts: x, buys: x, rolls: x, invs: x} } 
let users = {name:"users"}; // { ... user: { bal: [ balance, timeOfBalance, income ] , rolls: [ rolls, timeOfRolls ], reacts: [ same ], buys: ..., invs: ...,  col: collection } }   //   collection = { command: [ 1st card owned, 2nd... ] using cardIndex}
let storage = {name: "storage"};
let cache = {
    isLastAvailable: false,
    rollCache: [],
    rollIndex: 0,
    thereWasChange: false,
    waitingForConfirm : {status: false},
}; // used for aux and temp variables


// ---------------------------------------------------STARTUP-----------------------------------------------------------
// DATABASE
console.log("Retrieving data from database...");
(async () => (
     {cards, config, users, storage} = await DatabaseFunctions.fileAll(cards, config, users, "r", pool, storage)
    )
)().then( () => DiscordFunctions.updatePresence(client, config.prefix) ) // load all dicts from database
   .then( () => DatabaseFunctions.doInterval(cards, config, users, cache, pool, storage) ); // start autosave

// DISCORD
console.log("Connecting to Discord...");
client.login(process.env.DISCORD_TOKEN); // login bot
client.on("ready", function() { // ready event
    console.log("Connection to Discord established!");
});

// SERVER
keepAlive(); // opens express server


// --------------------------------------------------DISCORD EVENTS-----------------------------------------------------
// MESSAGES
client.on("message", async msg => {
    await Main(cards, config, users, msg, client, pool, cache, true, undefined, undefined, storage);
});

// REACTIONS
client.on("messageReactionAdd", async (reaction, user) => await Main(cards, config, users, undefined, client, pool, cache, false, reaction, user, storage));
client.on("messageReactionRemove", async (reaction, user) => await Main(cards, config, users, undefined, client, pool, cache, false, reaction, user, storage));
