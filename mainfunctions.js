const Discord = require("discord.js");

const Users = require("./users"); 
const DiscordFunctions = require("./discordia");
const DatabaseFunctions = require("./database"); 
const Cards = require("./cards");
const Games = require("./games");
const Texts = require("./messages");
const deleteThis = require("./deletethis"); // delete this
const AuxFuncs = require("./auxtools");
const ApiFunctions = require("./apis");
const MF = {

//------------------------------------------------------ADD---------------------------------------------------------
    async add ( {args, act, channel, cards, users} ) {
        if (act > 1) {
            if (args[1] in cards) { channel.send(`El comando \`${args[1]}\` ya existe`); } else { // make an exception for already existing commands

                cards[args[1]] = [];
                for (u in users) {
                    if (u == "name") { continue }
                    users[u]["col"][args[1]] = [];
                }
                channel.send(`Comando \`${args[1]}\` agregado`);

            }
        } else { channel.send(`Uso correcto: \`+ <comando>\``); }
    },



//------------------------------------------------------AUCTION---------------------------------------------------------





//-------------------------------------------------------BALANCE-------------------------------------------------------
    async balance ( argobj ) {
        await Users.idCorrection( argobj, true, async ( {cards, config, users, id} ) => "$" + await Users.updateData(id, "bal", users, config, cards) );
    },
    


//------------------------------------------------------BUY---------------------------------------------------------
    async buy ( cards, users, config, cardObj, id, channel, cache, guild ) {

        let pk = cardObj.card[0];
        let num = cardObj.card[1];
        let opInd = Cards.oFromC(num, cards[pk]);
        let mg = cardObj.msg;
        let cardName = AuxFuncs.capFirst(pk) + " #" + String(num + 1);

        let cardArray = cards[pk][opInd]; // actual card data

        if (cardArray[2] !== "") { channel.send(`La carta ${cardName} ya tiene un dueño`) } else { // exception for already owned card

            if (Users.updateData(id, "buys", users, config, cards) > 0) {

                let price = cardArray[3];
                let money = Users.updateData(id, "bal", users, config, cards);

                // exepction for not enough money
                if (money < price) { channel.send(`Te faltan $${price - money} para poder comprar ${cardName}`) } else {
                    
                    cards[pk][opInd][2] = id; // change ownership
                    users[id]["col"][pk][num] = true;

                    Users.addData(id, "bal", users, -price); // remove money
                    Users.addData(id, "buys", users, -1); // remove one buy

                    let ownerNick = Users.ownerNick(cards, cache.members, pk, num); // ownerNick
                    mg.edit( Cards.getCardEmbed(num, cards[pk], pk, ownerNick) );
                    
                    channel.send(`${ownerNick} compró ${cardName} por $${price}!`);

                }
            } else { channel.send("No tenés compras disponibles")}
        }
    },


//------------------------------------------------------BUYS---------------------------------------------------------
    async buys ( argobj ) {
        await Users.idCorrection( argobj, true, async ( {cards, config, users, id} ) =>
                                            await Users.updateData(id, "buys", users, config, cards) + " compras disponibles");
    },



//------------------------------------------------------CARD---------------------------------------------------------
    async card ( {act, args, cards, channel, cache, guild} ) {
        if (act > 1) {

            if ( !(args[1] in cards) ) { channel.send(`No existe el pack \`${args[1]}\``) } else { // exception for non existent pack
            
                if (act > 2) {

                    if (isNaN(args[2])) { channel.send(`Uso correcto: \`card <pack> <número>\``) } else { // exception for NaN

                        if (args[2] > Cards.cardsInCommand(cards[args[1]]) || args[2] <= 0) { channel.send(`El pack \`${args[1]}\` no tiene carta #${args[2]}`) } else { // exception for outOfBounds

                            cache.isLastAvailable = true;
                            cache.last = { pack: args[1], number: args[2] - 1, isCard: true};

                            let ownerNick = await Users.ownerNick(cards, cache.members, args[1], args[2] - 1) //get nick

                            channel.send(Cards.getCardEmbed(args[2] - 1, cards[args[1]], args[1], ownerNick));

                        }

                    }

                } else { channel.send(`Uso correcto: \`card <pack> <número>\``)}

            }


        } else { channel.send(`Uso correcto: \`card <pack> <número>\``); }
    },



//------------------------------------------------------COLLECTION----------------------------------------------------
    async collection ( argobj ) {
        await Users.idCorrection( argobj, false, async function( {cards, config, users, id, nickname, channel} )
            {
                    let results = await Users.collectionInfo(id, users, cards, config);

                    let pre = `__**Colección de ${nickname}:**__\n`;

                    let stringArray = results.slice(0, results.length - 1).map(r => {
                        
                        let [colName, cardsOwned, totalCards, totalValue, avgValue, pasInc, special] = r;
                        let additional;
                        special ? additional = " - Completa!" : additional = ""
                        return `**${colName}:** ${cardsOwned}/${totalCards} - Total: $${totalValue} - Promedio: $${avgValue} - Ingresos pasivos: $${pasInc}/día` + additional;

                    });

                    let [totalCards, totalValue, avgValue, pasInc, totalCardsofAll] = results[results.length - 1];
                    let post = `\n\n**Totales:** ${totalCards}/${totalCardsofAll} - Total: $${totalValue} - Promedio: $${avgValue} - Ingresos pasivos: $${pasInc}/día`;

                    let chunked = AuxFuncs.chunk([pre, ...stringArray, post], 20);
                    for (c of chunked) {
                        channel.send(c.join("\n"))
                    }

                    return "\n"

                    return pre + stringArray.join("\n") + post;

            }, true, async function( {users, id, nickname, cards, config}, pk ) {

                let pre = `__**Colección de ${nickname} (pack ${AuxFuncs.capFirst(pk)}):**__\n`;

                let med = Users.packInfoFromUser(id, users, cards, config, pk);

                return pre + med;

            } 
        );
    },



//------------------------------------------------------CONFIG----------------------------------------------------
    async config ( {channel, config} ) {

        channel.send(`__**Configuración:**__
**Prefijo para comandos:** \`${config.prefix}\`
**Valor base de cartas:** $\`${config.baseCardValue}\`
**Tamaño del roll caché:** \`${config.rollCacheSize}\`
**Recargas por día:** Rolls: \`${config.rates.rolls}\` - Compras: \`${config.rates.buys}\` - Reacciones: \`${config.rates.reacts}\` - Inversiones: \`${config.rates.invs}\`
**Máximos:** Rolls: \`${config.ratesMax.rolls}\` - Compras: \`${config.ratesMax.buys}\` - Reacciones: \`${config.ratesMax.reacts}\` - Inversiones: \`${config.ratesMax.invs}\`
**Multiplicador de ingresos pasivos por pack completo:** Tamaño del pack/\`${config.colRewardMultiplier}\`
**Ingresos pasivos por carta:** x\`1/${config.passiveIncomeDivider}\`
**Recompensa por reaccionar (dueño):** Valor de carta x\`${config.reactMultiplier}\`
**Recompensa por reaccionar (el que reacciona):** Recompensa de dueño x\`${config.reactorReward}\`
**Frecuencia de autoguardado:** \`${config.autosaveFrequency / 60000}\` minutos`);

    },



//------------------------------------------------------CONFIRM----------------------------------------------------
    async confirm ( {cache, channel, cards, users} ) {

        if (cache.waitingForConfirm.status) {

            let p = cache.waitingForConfirm.command;
            let n = cache.waitingForConfirm.number;

            let ownerNick;
            try {ownerNick = cache.members.get(cards[p][n][2]).nickname} catch(e) {ownerNick = cards[p][n][2]}
            channel.send(`Opción ${n+1} del comando \`${p}\` removida; ${ownerNick} fue compensado $${cards[p][n][3]}`);

            let ownerId = cards[p][n][2];
            users[ownerId]["bal"][0] += cards[p][n][3];
            users[ownerId]["col"][p][n] = false;
            cards[p].splice(n, 1);
            for (u in users) {
                if (u == "name") {continue}
                users[u]["col"][p].splice(n, 1);
            }    

            cache.isLastAvailable = false;

        } else {channel.send("Comando no disponible")}

    },




//------------------------------------------------------CUSTOM--------------------------------------------------------
    async custom ( {main, channel, cards, users, config, cache, args, act, id} ) {

        let arr = cards[main];
        let arrLen = arr.length;

        if (act > 1) {

            if (args[1] == "list") { // list

                let ans = [];
                for (const [i, c] of arr.entries()) {
                    ans.push(`Opción ${i+1}: ${c[1] == "txt" ? c[1] : c[1]}`)
                }
                channel.send(`Comando \`${main}\`:\n` + ans.join("\n"))

            } else if (args[1] == "+") { // add

                
                if (act > 2) {

                    let imageTypes = [".png", ".jpg", ".jpeg", ".gif"]
                    let type = ""
                    let toSave;
                    let wasFound = false;
                    for (const img of imageTypes) {
                        if (args[2].includes(img)) {
                            let sliceAt = args[2].search(img)
                            toSave = args[2].slice(0, sliceAt + img.length)
                            if (img === ".gif") {
                                cards[main].push([args.splice(2).join(" "), "gif", "", 0, 1, 0, ""]);
                                type = "gif";
                                channel.send("Gif agregado al comando `" + main + "`")
                            } else {
                                cards[main].push([args.splice(2).join(" "), "img", "", 0, 1, 0, ""]);
                                type = "img"
                                channel.send("Imagen agregada al comando `" + main + "`")
                            }
                            wasFound = true;
                            break
                        }
                    }
                    if (!wasFound) {
                        if (args[2].includes("tenor") && args[2].includes("gif") && !args[2].endsWith(".gif")) { 

                            ApiFunctions.getGif(args[2], main, cards, users);
                            channel.send("Gif agregado al comando `" + main + "`")
                            return;

                        }else if (!isNaN(args[2])) {

                            if (act > 3) { // adding gifs or images

                                let searchTerm = main;
                                if (act > 4) { searchTerm = args.splice(4).join(" ") }

                                if (args[3] == "img" || args[3] == "imgs") { // imgs

                                    ApiFunctions.saveImgsToCards(args[2], searchTerm, channel, main, cards, users);

                                } else if (args[3] == "gif" || args[3] == "gifs") { // gifs

                                    ApiFunctions.saveGifsToCards(args[2], searchTerm, channel, main, cards, users);

                                } else { channel.send("Uso correcto: leer `help cmd`") } 
                                return;
                            }

                        } else { // plain text

                            toSave = args.splice(2).join(" ")
                            type = "txt";
                            channel.send("Texto agregado al comando `" + main + "`")

                        }
                    }

                    cards[main].push([toSave, type, "", 0, 1, 0, ""]);

                } else { channel.send( "Uso correcto: leer `help cmd`") } // not enough args

            } else if (args[1] == "-") { // remove

                if (arrLen > 0) { // last, all, specific

                    let toRemove;
                    let numb;
                    if (act > 2) {

                        if (args[2] == "last") { // remove last shown

                            if (cache.isLastAvailable && cache.last.pack == main) {

                                numb = cache.last.number;
                                toRemove = arr[numb]

                            } else {channel.send("Comando no disponible"); return;}

                        } else if (args[2] == "all") {

                            let owners = Cards.owners(arr, cache);
                            if (owners.length > 0) {
                                channel.send(`El comando \`${main}\` contiene opciones pertenecientes a: ` + owners.join(", "));
                            } else {

                                cards[main] = [];
                                for (u in users) {
                                    if (u == "name") { continue }
                                    users[u]["col"][main] = [];
                                }
                                channel.send(`Todas las opciones del comando \`${main}\` removidas`);
                                cache.isLastAvailable = false;

                            }

                            return;

                        } else if (!isNaN(args[2])) { //specific

                            if (args[2] <= 0 || args[2] > arrLen) { channel.send(`El comando \`${main}\` no contiene la opción ${args[2]}`); return;} else {

                                numb = args[2]-1;
                                toRemove = arr[args[2]-1];

                            }

                        } else { channel.send("Uso correcto: leer `help cmd`"); return;}

                    } else { // remove last added option (NOT LAST SHOWN)

                        numb = arrLen-1;
                        toRemove = arr[numb];

                    }


                    // ACTUAL REMOVE CODE
                    if (toRemove[2] == "" || toRemove[2] == id) {

                        channel.send(`Opción ${numb+1} del comando \`${main}\` removida` + (toRemove[2] == id ? ` y fuiste compensado su valor ($${toRemove[3]})` : ""));
                        cache.isLastAvailable = false;
                        cards[main].splice(numb, 1);

                        if (toRemove[2] == id) {
                            users[id]["bal"][0] += toRemove[3];
                        }

                        for (u in users) {
                            if (u == "name") {continue}
                            users[u]["col"][main].splice(numb, 1);
                        }  

                    } else {

                        let ownerNickname;
                        try { ownerNickname = cache.members.get(toRemove[2]).nickname } catch(e) { ownerNickname = toRemove[2] }
                        channel.send(`Esa opción (${numb+1}) le pertenece a ${ownerNickname}; confirmá con el comando \`confirm\` y se compensará su valor al dueño`);
                        channel.send(Cards.getCardEmbed(Cards.cFromO(numb, cards[main]), cards[main], main, ownerNickname));
                        cache.waitingForConfirm = {status: true, command: main, number: numb}

                    }
                
                } else { channel.send("El comando `"+ main +"` no contiene opciones")}

            } else if (!isNaN(args[1])) { // show specific

                if (args[1] > arrLen || args[1] <= 0) { channel.send(`El comando \`${main}\` no contiene la opción ${args[1]}`) } else {

                    channel.send( arr[args[1]-1][0] );
                    cache.last = { pack: main, number: args[1]-1, isCard: false }

                }

            } else { channel.send("Uso correcto: leer `help cmd`") }

        }   else { // random option

            if (arrLen == 0) { channel.send(`El comando \`${main}\` no contiene opciones`) } else {

                let rand = Math.floor(Math.random()*arrLen);
                cache.last = { pack: main, number: rand, isCard: false }
                cache.isLastAvailable = true;
                channel.send(arr[ rand ][0]);
            
            }

        }

    },



//------------------------------------------------------DEBUG--------------------------------------------------------
    async debug ( {cards, config, users, id, username, channel, client, args, cache, guild, storage} ) {
        let code = args.slice(1).join(" ");
        try {
            console.log(`Evaluating ( ${code} )...`);
            let evaled = await eval(code);
            console.log(evaled);
            await channel.send(evaled);
        } catch(e) {
            let eMsg = e.name + ": " + e.message;
            console.log(eMsg);
            channel.send("`" + eMsg + "`");  
        }
    },



//------------------------------------------------------EXIT---------------------------------------------------------
    async exit ( {channel, client, cards, config, users, pool, act, args, storage} ) {

        let save = true;
        let ret = false;

        if (act > 1) {
            let mis = false;
            args[1] == "nosave" ? save = false : mis = true

            if (mis) {
                channel.send("Escribí `exit nosave` para desconectar el bot sin guardar datos");
                return
            }
        }

        console.log("Shutting down due to user input...");

        let extra;
        save ? extra = "" : extra = " sin guardar";
        await channel.send(`Apagando bot${extra}...`);
        await client.destroy();

        save ? await DatabaseFunctions.fileAll(cards, config, users, "w", pool, storage) : {}

        process.exit();    
    },



//------------------------------------------------------GAME---------------------------------------------------------
    async game ( { cache, channel, args, act } ) {

        if (act > 1) {

            let game, gameName, board, boardMsg;

            switch (args[1]) {

                case "list":
                    channel.send(Texts.games.join("\n"));
                    break;

                case "c4":
                case "C4":
                case "connect4":
                case "connect":

                    game = new Games.C4(10, 10);
                    gameName = "c4";
                    board = new Discord.MessageEmbed().setDescription(game.renderBoard()).setTitle("4 en línea  -  :blue_circle: vs :red_circle:");
                    boardMsg = await channel.send(board);
                    game.reactBoard(boardMsg, Texts.regionals);

                    break;

                default:

                    channel.send(`El juego \`${args[1]}\` no existe`);

            }

            cache.game = game;
            cache.gameName = gameName;
            cache.board = board;
            cache.boardMsg = boardMsg;

        } else { channel.send(`Uso correcto: \`game <juego>\``) }

    },



//------------------------------------------------------GIVE---------------------------------------------------------
    async give ( {act, args, cards, channel, cache, guild, id, users, config, nickname} ) {

        if (act > 1) {

            if ( !isNaN(args[1]) ) { // give money

                if (Users.updateData(id, "bal", users, config, cards) >= args[1]) {

                    if (args[1] <= 0) { channel.send("Ingresá un número positivo") } else {

                        if (act > 2) {

                            let response = Users.getActualId(args[2], config);
                                if (response.success) {

                                    let recipientNick = args[2]
                                    let recipientID = response.id; //id of recipient

                                    users[id]["bal"][0] -= Number(args[1]); // update balances
                                    users[recipientID]["bal"][0] += Number(args[1]);

                                    channel.send(`${nickname} le dio $${args[1]} a ${recipientNick}!`); // msg

                                } else { channel.send(`El nombre \`${args[2]}\` no está registrado`) }

                        } else { channel.send("Uso correcto: `give <plata> <usuario>`")}

                    }

                } else { channel.send("No tenés suficiente plata") }

            } else if ( !(args[1] in cards) ) { channel.send(`No existe el pack \`${args[1]}\``) } else { // exception for non existent pack
            
                if (act > 2) {

                    if (isNaN(args[2])) { channel.send(`Uso correcto: \`give <pack> <número> <usuario>\``) } else { // exception for NaN

                        if (args[2] > Cards.cardsInCommand(cards[args[1]]) || args[2] <= 0) { channel.send(`El pack \`${args[1]}\` no tiene carta #${args[2]}`) } else { // exception for outOfBounds

                            if (act > 3) {

                                let response = Users.getActualId(args[3], config);
                                if (response.success) {

                                    let recipientNick = args[3]
                                    let recipientID = response.id; //id of recipient

                                    let cArr = cards[args[1]][Cards.oFromC(args[2] - 1, cards[args[1]])]; // card array

                                    let owner = cArr[2];

                                    let cardName = AuxFuncs.capFirst(args[1]) + " #" + String(args[2]); // card Name for showing

                                    if (id != owner) { channel.send("Esa carta no es tuya") } else {

                                            cArr[2] = recipientID; // change ownership

                                            users[id]["col"][args[1]][args[2] - 1] = false; // update collections
                                            users[recipientID]["col"][args[1]][args[2] - 1] = true;

                                            channel.send(`${nickname} le dio ${cardName} a ${recipientNick}!`); // msg
                                            channel.send(Cards.getCardEmbed(args[2] - 1, cards[args[1]], args[1], recipientNick)); // card

                                    }

                                } else { channel.send(`El nombre \`${args[3]}\` no está registrado`) }

                            } else { channel.send(`Uso correcto: \`give <pack> <número> <usuario>\``) }

                        }

                    }

                } else { channel.send(`Uso correcto: \`give <pack> <número> <usuario>\``)}

            }


        } else { channel.send(`Uso correcto: \`give <pack> <número> <usuario>\``); }
    },



//------------------------------------------------------HELP---------------------------------------------------------
    async help ( {act, args, channel, config} ) {
        if (act > 1) {
            if (args[1] in Texts.help) {
                channel.send( Texts.help[args[1]].join("\n") );
            } else {
                channel.send("Uso correcto: leer `help`");
            }
        } else {
            channel.send([`__**Ayuda general:**__\n\`${config.prefix}\` indica el comienzo de un **comando**`, ...Texts.help.all].join("\n")); // regular help
        }
    },




//------------------------------------------------------ID---------------------------------------------------------
    async id ( {args, nickname, username, id, users, channel, act, config} ) {

        if (act > 1) {

            switch (args[1]) {                // automatically set id to user

                case "auto":
                    config.nicks[nickname] = id;
                    config.nicks[username] = id;
                    channel.send("Se agregó tu nombre a la lista de IDs");
                    break;

                case "delete":
                case "del":                   // remove a given name from ids
                case "-":
                    if (act > 2) { 
                        let success = true;
                        args[2] in config.nicks ? delete config.nicks[args[2]] : success = false
                        success ? channel.send(`Nombre \`${args[2]}\` eliminado de los IDs`) : channel.send(`\`${args[2]}\` no está en la lista de IDs`)
                    } else {
                        channel.send(`Uso correcto: \`id - <nombre>\``);
                    }
                    break;

                case "list":
                    let list = [];
                    for (i in users) {
                        if (i == "name") { continue }
                        let nicks = Users.getNicks(config, i);
                        let extra
                        nicks.length > 0 ? extra = nicks.join("`, `") : extra = "Sin nombre"
                        list.push(`\`${i}\` es el ID de: \`${extra}\``)
                    }
                    channel.send("**__Lista de IDs:__**\n" + list.join("\n"));
                    break;

                default:                      // add an id
                    if (act > 2) {
                        let success = true;
                        args[2] in users ? config.nicks[args[1]] = args[2] : success = false
                        success ? channel.send(`ID asignado al nombre \`${args[1]}\``) : channel.send("Ingresá un ID válido")
                    } else {
                        config.nicks[args[1]] = id;
                        channel.send(`Se agregó \`${args[1]}\` a los nombres asociados a tu ID`);
                    }

            }

        } else { // show id 

            channel.send(`Tu ID es \`${id}\`\nLos nombres asociados al mismo son: \`${Users.getNicks(config, id).join("`, `")}\``);

        }
    },



//------------------------------------------------------INV---------------------------------------------------------
async inv ( {act, args, cards, channel, cache, guild, id, users, config} ) {

    if (act > 1) {

        if ( !(args[1] in cards) ) { channel.send(`No existe el pack \`${args[1]}\``) } else { // exception for non existent pack
        
            if (act > 2) {

                if (isNaN(args[2])) { channel.send(`Uso correcto: \`inv <pack> <número>\``) } else { // exception for NaN

                    if (args[2] > Cards.cardsInCommand(cards[args[1]]) || args[2] <= 0) { channel.send(`El pack \`${args[1]}\` no tiene carta #${args[2]}`) } else { // exception for outOfBounds

                        if (Users.updateData(id, "invs", users, config, cards) > 0) {

                            let cArr = cards[args[1]][Cards.oFromC(args[2] - 1, cards[args[1]])]; // card array

                            let owner = cArr[2];
                            let price = cArr[3];
                            let cardName = AuxFuncs.capFirst(args[1]) + " #" + String(args[2]);

                            if (id != owner) { channel.send("Esa carta no es tuya") } else {

                                if (Users.updateData(id, "bal", users, config, cards) < price) { channel.send("No tenés suficiente plata para invertir en esa carta") } else {

                                    Users.addData(id, "bal", users, -price); //remove money
                                    cArr[4]++; //multiplier
                                    Users.addData(id, "invs", users, -1);

                                    let ownerNick = Users.ownerNick(cards, cache.members, args[1], args[2] - 1); //get nick
                                    channel.send(`${ownerNick} invirtió en ${cardName}`);

                                    
                                    channel.send(Cards.getCardEmbed(args[2] - 1, cards[args[1]], args[1], ownerNick));

                                }
                            }

                        } else { channel.send("No tenés inversiones disponibles") }

                    }

                }

            } else { channel.send(`Uso correcto: \`inv <pack> <número>\``)}

        }


    } else { channel.send(`Uso correcto: \`inv <pack> <número>\``); }
},




//------------------------------------------------------INVS---------------------------------------------------------
    async invs ( argobj ) {
        await Users.idCorrection( argobj, true, async ( {cards, config, users, id} ) =>
                                            await Users.updateData(id, "invs", users, config, cards) + " inversiones disponibles");
    },



//------------------------------------------------------LIST---------------------------------------------------------
    async list ( {cards, channel} ) {
        let ans = ["**__Comandos personalizados:__**"];
        for ( i in cards) {
            if (i == "name") { continue }
            let ar = cards[i];
            let len = ar.length;
            let cds = Cards.cardsInCommand(ar);
            ans.push(`\`${i}\`: ${cds} cartas - ${len-cds} textos`);
        }
        channel.send(ans.join("\n"))
    },




//------------------------------------------------------NEXT-------------------------------------------------------
    async next ( {cache, cards, channel} ) {

        if (cache.last.isCard) { // last is card

            let newIndex = cache.last.number + 1;
            let cInCmd = Cards.cardsInCommand( cards[cache.last.pack] );
            if (newIndex >= cInCmd) {
                newIndex = 0;
            } else if (newIndex < 0) {
                newIndex = cInCmd - 1;
            }
            let ownerNickname = Users.ownerNick(cards, cache.members, cache.last.pack, newIndex);

            let response = Cards.neighbour(1, cache, cards, ownerNickname);

            if (response.newIndex != -1) {
                cache.last.number = response.newIndex;
            }
            channel.send( response.message );

        } else { // last is option

            let newIndex = cache.last.number + 1;
            let max = cards[cache.last.pack].length;
            if (newIndex >= max) {
                newIndex = 0;
            } else if (newIndex < 0) {
                newIndex = max - 1;
            }

            cache.last.number = newIndex;
            channel.send ( cards[cache.last.pack][newIndex][0] )

        }
    },



//------------------------------------------------------PACK-------------------------------------------------------
    async pack ( {act, args, cards, channel, config, users, cache} ) {
        if (act > 1) {

            if (args[1] == "list") {

                let totalOwned = 0;
                let totalCards = 0;
                let totalValue = 0;
                let avgValue = 0;
                let totalGifs = 0;
                let totalImgs = 0;

                let title = "**__Lista de packs:__**\n";
                let rest = [];
                for (i in cards) {

                    if (i == "name") {continue}
                    let arr = cards[i];

                    let cInC = Cards.cardsInCommand(arr);
                    totalCards += cInC;
                    if (cInC == 0) {continue}

                    let gifs = 0, imgs = 0, value = 0, owned = 0;

                    for (c of arr) {
                        if (c[1] == "txt") {continue}
                        if (c[1] == "gif") {gifs++} else {imgs++}
                        if (c[2] !== "") {owned++}
                        value += c[3];
                    }
                    totalGifs += gifs;
                    totalImgs += imgs;
                    totalValue += value;
                    totalOwned += owned;

                    let avg;
                    value == 0 ? avg = 0 : avg = Math.round(value/cInC);
                    rest.push(`**${AuxFuncs.capFirst(i)}:** ${gifs} gifs - ${imgs} imágenes - Total: $${value} - Promedio: $${avg} - ${owned}/${cInC} con dueño`)

                }

                let chunked = AuxFuncs.chunk(rest, 20);
                let last = `\n**Totales:** ${totalGifs} gifs - ${totalImgs} imágenes - Total: $${totalValue} - Promedio: $${Math.round(totalValue/totalCards)} - ${totalOwned}/${totalCards} con dueño`

                channel.send(title);
                for (let c of chunked) {
                    if (c == chunked[chunked.length-1]) {
                        c = [...c, last];
                    }
                    channel.send(c.join("\n"));
                }

            } else if ( !(args[1] in cards) ) { channel.send(`No existe el pack \`${args[1]}\``) } else { // exception for non existent pack
                
                let title = `**__Pack ${AuxFuncs.capFirst(args[1])}__**\n`

                channel.send(title + Users.packInfoFromUser(undefined, users, cards, config, args[1], cache, true));

            }


        } else { channel.send(`Uso correcto: \`pack <pack>\``); }
    },



//------------------------------------------------------PREFIX-------------------------------------------------------
    async prefix ( {config, channel, act, args, client} ) {
        if (act > 1) {

            config["prefix"] = args[1];
            channel.send(`Nuevo prefijo para comandos: \`${args[1]}\``);
            DiscordFunctions.updatePresence(client, args[1]);

        } else { channel.send(`Uso correcto: \`prefix <prefijo>\``)}
    },



//------------------------------------------------------PREV------------------------------------------------------- 
    async previous ( {cache, cards, channel} ) {

        if (cache.last.isCard) {

            let newIndex = cache.last.number - 1;
            let cInCmd = Cards.cardsInCommand( cards[cache.last.pack] );
            if (newIndex >= cInCmd) {
                newIndex = 0;
            } else if (newIndex < 0) {
                newIndex = cInCmd - 1;
            }
            let ownerNickname = Users.ownerNick(cards, cache.members, cache.last.pack, newIndex);

            let response = Cards.neighbour(-1, cache, cards, ownerNickname);

            if (response.newIndex != -1) {
                cache.last.number = response.newIndex;
            }
            channel.send( response.message );

        } else {

            let newIndex = cache.last.number - 1;
            let max = cards[cache.last.pack].length;
            if (newIndex >= max) {
                newIndex = 0;
            } else if (newIndex < 0) {
                newIndex = max - 1;
            }

            cache.last.number = newIndex;
            channel.send ( cards[cache.last.pack][newIndex][0] )

        }
    },



//------------------------------------------------------REACT--------------------------------------------------------
    async react ( cards, users, config, cardObj, id, channel, cache, nickname ) {

        if (Users.updateData(id, "reacts", users, config, cards) > 0) {

            let pk = cardObj.card[0];
            let num = cardObj.card[1];
            let opInd = Cards.oFromC(num, cards[pk]);
            let mg = cardObj.msg;
            let reactedBy = cardObj.reactedBy;
            let cardName = AuxFuncs.capFirst(pk) + " #" + String(num + 1);

            let cardArray = cards[pk][opInd]; // actual card data

            let value = cardArray[3];
            let money = value*cardArray[4]*config.reactMultiplier;
            let secondaryMoney = money*config.reactorReward;

            // exepction for not enough money
            if (reactedBy.includes(id)) { channel.send(`Ya reaccionaste a esta carta`) } else {
                
                reactedBy.push(id); // stop from reacting many times
     // add money
                Users.addData(id, "reacts", users, -1); // remove reaction

                let ownerNick = Users.ownerNick(cards, cache.members, pk, num); // ownerNick

                if (ownerNick != "-") {
                    channel.send(`${nickname} ganó $${secondaryMoney} y el dueño de la carta (${ownerNick}) ganó $${money} por reaccionar a ${cardName}!`);
                    Users.addData(cards[pk][opInd][2], "bal", users, money); // add money to owner too
                    Users.addData(id, "bal", users, secondaryMoney);
                    
                } else {
                    channel.send(`${nickname} ganó $${money} por reaccionar a ${cardName}!`);
                    Users.addData(id, "bal", users, money);
                }

            }

        } else { channel.send("No tenés reacciones disponibles") }

    },



//------------------------------------------------------REACTS--------------------------------------------------------
    async reacts ( argobj ) {
        await Users.idCorrection( argobj, true, async ( {cards, config, users, id} ) =>
                                            await Users.updateData(id, "reacts", users, config, cards) + " reacciones disponibles");
    },



//------------------------------------------------------REMOVE---------------------------------------------------------
    async remove ( {args, act, channel, cards, users, cache} ) {
        if (act > 1) {
            if ( !(args[1] in cards) ) { channel.send(`El comando \`${args[1]}\` no existe`); } else { // make an exception for non existing commands

                let owners = Cards.owners(cards[args[1]], cache);
                if (owners.length > 0) {
                    channel.send(`El comando \`${args[1]}\` contiene opciones pertenecientes a: ` + owners.join(", "));
                } else {

                    delete cards[args[1]];
                    for (u in users) {
                        if (u == "name") { continue }
                        delete users[u]["col"][args[1]];
                    }
                    channel.send(`Comando \`${args[1]}\` removido`);
                    cache.isLastAvailable = false;

                }

            }
        } else { channel.send(`Uso correcto: \`- <comando>\``); }
    },




//------------------------------------------------------RENAME-------------------------------------------------------
async rename ( {act, args, cards, channel, cache, guild, id, users, config} ) {

    if (act > 1) {

        if ( !(args[1] in cards) ) { channel.send(`No existe el pack \`${args[1]}\``) } else { // exception for non existent pack
        
            if (act > 2) {

                if (isNaN(args[2])) { channel.send(`Uso correcto: \`rename <pack> <número> <nombre>\``) } else { // exception for NaN

                    if (args[2] > Cards.cardsInCommand(cards[args[1]]) || args[2] <= 0) { channel.send(`El pack \`${args[1]}\` no tiene carta #${args[2]}`) } else { // exception for outOfBounds


                            let cArr = cards[args[1]][Cards.oFromC(args[2] - 1, cards[args[1]])]; // card array

                            let owner = cArr[2];
                            let price = cArr[3];
                            let cardName = AuxFuncs.capFirst(args[1]) + " #" + String(args[2]);

                            if (id != owner) { channel.send("Esa carta no es tuya") } else {

                                if (act > 3) {

                                    let newName = args.slice(3).join(" ") // card name

                                    cArr[5] = newName; // change card name

                                    let ownerNick = Users.ownerNick(cards, cache.members, args[1], args[2] - 1); //get nick
                                    channel.send(`${cardName} ahora se llama "${newName}"!`);

                                    
                                    channel.send(Cards.getCardEmbed(args[2] - 1, cards[args[1]], args[1], ownerNick));


                                } else { channel.send(`Uso correcto: \`rename <pack> <número> <nombre>\``) }
                            }


                    }

                }

            } else { channel.send(`Uso correcto: \`rename <pack> <número> <nombre>\``)}

        }


    } else { channel.send(`Uso correcto: \`rename <pack> <número> <nombre>\``); }

},




//------------------------------------------------------RESET--------------------------------------------------------
    async reset ( { channel, client } ) {
        let last = channel.send("Reiniciando conexión con Discord...");
        await DiscordFunctions.reset(client);
        await last.edit("Reiniciando conexión con Discord... listo");
    },



//------------------------------------------------------ROLL---------------------------------------------------------
    async roll ( {cards, cache, channel, id, users, config, guild} ) {

        if (Users.updateData(id, "rolls", users, config, cards) > 0) {

            // essential things
            Users.addData(id, "rolls", users, -1);
            let [pk, num] = Cards.selectRandomCard(cards);
            cache.isLastAvailable = true;
            cache.last = {pack: pk, number: num, isCard: true}

            // increase value
            cards[pk][Cards.oFromC(num, cards[pk])][3] += config.baseCardValue;
            if (cards[pk][Cards.oFromC(num, cards[pk])][1] == "gif") { // extra if card is gif
                cards[pk][Cards.oFromC(num, cards[pk])][3] += config.baseCardValue;
            }

            // show card and save msg in cache
            let ownerNick = await Users.ownerNick(cards, cache.members, pk, num) // get nick

            let msg = await channel.send( Cards.getCardEmbed(num, cards[pk], pk, ownerNick) );
            cache.rollCache[cache.rollIndex] = { card: [pk, num], msg: msg, reactedBy: [] };
            cache.rollIndex++;
            cache.rollIndex >= config.rollCacheSize ? cache.rollIndex = 0 : {}

            // react
            if (ownerNick == "-") { msg.react("💰"); } // only show this emoji when there is no owner.
            msg.react(Texts["reactions"][Math.floor(Math.random()*Texts["reactions"].length)]);

        } else { channel.send("No tenés rolls disponibles"); }
    },



//------------------------------------------------------ROLLS--------------------------------------------------------
    async rolls ( argobj ) {
        await Users.idCorrection( argobj, true, async ( {cards, config, users, id} ) =>
                                            await Users.updateData(id, "rolls", users, config, cards) + " rolls disponibles");
    },



//------------------------------------------------------SAVE---------------------------------------------------------
    async save ( {cards, config, users, pool, channel, storage} ) {
        console.log("Saving data...");
        let last = await channel.send("Guardando datos...");
        await DatabaseFunctions.fileAll(cards, config, users, "w", pool, storage);
        await last.edit("Guardando datos... listo");
    },



//------------------------------------------------------SELL---------------------------------------------------------
    async sell ( {act, args, cards, channel, cache, guild, id, users, config, nickname} ) {

        if (act > 1) {

            if ( !(args[1] in cards) ) { channel.send(`No existe el pack \`${args[1]}\``) } else { // exception for non existent pack
            
                if (act > 2) {

                    if (args[2] == "all") { // exception for NaN 
                                                                
                        // sell pack ALL
                        let soldCards = 0;
                        let soldMoney = 0;
                        let cArr = cards[args[1]];
                        for (let i = 0; i < cArr.length; i++) {
                            if (users[id]["col"][args[1]][i]) { // check if owner of card
                                
                                soldCards++;
                                soldMoney += cArr[i][3]/2; //HALF the money
                                cArr[i][2] = ""; // remove ownership
                                users[id]["col"][args[1]][i] = false;

                            }
                        }
                        channel.send(`${nickname} vendió todas las cartas del pack ${AuxFuncs.capFirst(args[1])} (${soldCards}) por $${soldMoney}!`);

                    } else if (isNaN(args[2])) { channel.send(`Uso correcto: \`sell <pack> <número>\``) 
                    } else if (args[2] > Cards.cardsInCommand(cards[args[1]]) || args[2] <= 0) { channel.send(`El pack \`${args[1]}\` no tiene carta #${args[2]}`) } else { // exception for outOfBounds



                            let cArr = cards[args[1]][Cards.oFromC(args[2] - 1, cards[args[1]])]; // card array

                            let owner = cArr[2];
                            let price = cArr[3];
                            let cardName = AuxFuncs.capFirst(args[1]) + " #" + String(args[2]);

                            if (id != owner) { channel.send("Esa carta no es tuya") } else {

                                    cArr[2] = "";
                                    users[id]["col"][args[1]][args[2]-1] = false
                                    users[id]["bal"][0] += price/2
                                    channel.send(`${nickname} vendió ${cardName} por $${price/2}!`);
                                    channel.send(Cards.getCardEmbed(args[2] - 1, cards[args[1]], args[1], "-"));

                            }


                    }

                } else { channel.send(`Uso correcto: \`sell <pack> <número>\``)}

            }


        } else { channel.send(`Uso correcto: \`sell <pack> <número>\``); }
    },




//------------------------------------------------------TOP---------------------------------------------------------
    async top ( {act, args, channel, config, cards, users, cache} ) {

        if (act > 1) {

            switch(args[1]) {

                case "u":
                case "user":
                case "users":
                    channel.send("**__Top usuarios:__**\n" + Users.getTop(users, config, cards, cache));
                    break;


                case "c":
                case "card":
                case "cards":
                    channel.send("**__Top cartas:__**\n" + Cards.getTop(cards, cache));
                    break;


                default:
                    channel.send(`Uso correcto: \`top <categoría>\``);

            }

        } else { channel.send(`Uso correcto: \`top <categoría>\``) }

    },




//------------------------------------------------------USER---------------------------------------------------------
    async user ( argobj ) {
        await Users.idCorrection( argobj, false, async ( {cards, config, users, id, guild, nickname, cache} ) =>
                                            await Users.getUserEmbed(id, guild, users, config, cards, nickname, cache));
    },


//------------------------------------------------------WAIT---------------------------------------------------------
    async wait ( {users, config, id, cards, channel} ) {
        let ans = ["**Tiempos restantes:**"];
        for (key in users[id]) {
            if (key == "name" || key == "col" || key == "bal") {
                continue
            }
            Users.updateData(id, key, users, config, cards);
            let value = users[id][key][0];
            let decimalRemaining = 1 - (value - Math.floor(value));
            let timeLeft = Math.round(decimalRemaining/config.rates[key]*24*60);
            ans.push(`${timeLeft} mins para más ${key}`);
        }
        channel.send(ans.join("\n"))
    }


};












/*---------------------------------------------------------------------------------------------------------------------
---------------------------------------------------------SYNONYMS------------------------------------------------------
---------------------------------------------------------------------------------------------------------------------*/

let synonyms = {

    "bal": "balance",
    "dg": "debug",
    "col": "collection",
    "u": "user",
    "+": "add",
    "-": "remove",
    "rmv": "remove",
    "play": "game",
    "c": "card",
    "n": "next",
    "p": "previous",
    "prev": "previous",
    "r": "roll",
    "cfg": "config",
    "h": "help",

}

for (toMap in synonyms) {
    MF[toMap] = MF[synonyms[toMap]];
}







module.exports = MF;