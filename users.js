const Aux = require("./auxtools"); // for aux tools
const Cards = require("./cards"); // card functions
const Discord = require("discord.js"); // for Discord object

const Users = {

    collectionInfo(id, users, cards, config) { // info for /collection command
        let ans = []; // returns array of all collections data plus last row for totals, row format is [cardsOwned, cardsTotal, totalValue, avgValue, passiveIncome]
    
        let userCollection = users[id]["col"];
        let actualUserCollection = {};
        for (coll in userCollection) {
            actualUserCollection[coll] = userCollection[coll].map( (v, i) => v? i : -1 ).filter( v => v >= 0 ); // obtain classic representation of user collection
        }

        //totals
        let actualTotal = 0; // total money value
        let totalAmount = 0; // total card amount
        let passiveIncome = 0; // total passive income
    
        for (coll in actualUserCollection) {
            if (actualUserCollection[coll].length == 0) {
                continue;
            }
    
            let totalValue = 0;
            for (var i = 0; i < actualUserCollection[coll].length; i++) {
                totalValue += cards[coll][Cards.oFromC(actualUserCollection[coll][i], cards[coll])][3];
            }

            let miniPassive = 0;
            for (var i = 0; i < actualUserCollection[coll].length; i++) {
                miniPassive += cards[coll][Cards.oFromC(actualUserCollection[coll][i], cards[coll])][3]*cards[coll][Cards.oFromC(i, cards[coll])][4]/config.passiveIncomeDivider;
            }
    
            let special = false; // used to know if user has all the collection
            if (actualUserCollection[coll].length == Cards.cardsInCommand(cards[coll])) { // double the passive income if you have the whole collection
                miniPassive *= config.colRewardMultiplier;
                special = true;
            }
            passiveIncome += miniPassive;
    
            ans.push([Aux.capFirst(coll), actualUserCollection[coll].length, Cards.cardsInCommand(cards[coll]), totalValue, Math.round(totalValue/actualUserCollection[coll].length), miniPassive, special]);
                   // 0nameOfCollection,    1cardsOwned,                2totalCards,                      3totalValue,                4averageValue,                   5passiveIncome, 6special
            
            actualTotal += totalValue;
            totalAmount += actualUserCollection[coll].length;
        }
        //           totalCards, totalValue, avg,  passiveincome,     totalcards
        ans.push( [ totalAmount, actualTotal, 0, passiveIncome, Cards.totalCards(cards) ] ); // last row
        if (totalAmount > 0) {
            ans[ans.length-1][2] = Math.round(actualTotal / totalAmount);
        }
    
        return ans;
    },

    packInfoFromUser(id = undefined, users, cards, config, pack, cache = undefined, specificUser = false) { // for collection pack
        let ca = cards[pack];
        if (!specificUser) {

            let userCollection = users[id]["col"][pack];
            let actualUserCollection = userCollection.map( (v, i) => v? i : -1 ).filter( v => v >= 0 ); // obtain classic representation of user collection
            let total = 0;
            actualUserCollection.forEach( (v) => total += ca[v][3] );
            let avg;
            actualUserCollection.length == 0 ? avg = 0 : avg = Math.round(total / actualUserCollection.length);

            return (

                actualUserCollection.map( v => `**#${v+1} ${ ca[v][5]?`"${ca[v][5]}"`:"" }** - Valor: $${ca[v][3]} - Multiplicador: x${ca[v][4]}`).join("\n")
                + `\n\n**Valor total:** $${total} - **Valor promedio:** $${avg}`

            );

        } else {

            let total = 0;
            ca.forEach( (v) => total += v[3] );
            let avg;
            ca.length == 0 ? avg = 0 : avg = Math.round(total / ca.length);
            return (ca.filter(v => v[1] != "txt").map( (v, i) => {
                    let name;
                    try {
                        name = cache.members.get(v[2]).nickname;
                    } catch(e) {
                        name = v[2];
                    }
                    name == "" ? name = "-" : {}
                    return `**#${Cards.cFromO(i, ca)+1} ${ v[5]?`"${v[5]}"`:""}** - Valor: $${v[3]} - Multiplicador: x${v[4]} - Dueño: ${name}`
                }
            ).join("\n") + `\n\n**Valor total:** $${total} - **Valor promedio:** $${avg}`

            )
        }
    },

    async getUserEmbed(id, guild, users, config, cards, nickname, cache) { // generate a user embed for /user command

        this.updateData(id, "bal", users, config, cards); // first update its balance (other data is updated later)
    
        let userInfo = this.collectionInfo(id, users, cards, config);
    
        let toDisplayCollection = "No tiene cartas";
        let toDisplayTotal = "No tiene cartas";
        let toDisplayValue = "No tiene cartas";
        if (userInfo.length > 1) {
            toDisplayCollection = "";
            for (var i = 0; i < userInfo.length - 1; i++) {
                toDisplayCollection += userInfo[i][0] + ": " + userInfo[i][1] + "/" + userInfo[i][2] + "\n";
            }
            toDisplayTotal = userInfo[userInfo.length-1][0] + "/" + Cards.totalCards(cards) + " cartas";
            toDisplayValue = "Total: $" + userInfo[userInfo.length-1][1] + "\nPromedio: $" + userInfo[userInfo.length-1][2];
        }

        let user, toDisplayAvatar, displayHexColor, displayName;
        try {
            ( {user, displayHexColor, displayName} = cache.members.get(id) );
            toDisplayAvatar = user.avatarURL();
        } catch (error) {
            console.log("Can't fetch member object of a user from another server");
            displayName = nickname;
        }
        
    
        let ans = new Discord.MessageEmbed()
            .setFooter("nombres: " + this.getNicks(config, id).join(", ") + "  -  id: " + id)
            .setTitle("__" + displayName + "__")
            .setThumbnail(toDisplayAvatar)
            .setColor(displayHexColor)
            .addFields(
                { name: "Colección", value: toDisplayCollection, inline: true },
                { name: "Valor", value: toDisplayValue, inline: true },
                { name: "Cantidad total", value: toDisplayTotal, inline: true },
                { name: "Balance", value: "$" + Math.floor(users[id]["bal"][0]), inline: true },
                { name: "Ingresos pasivos", value: "$" + userInfo[userInfo.length-1][3] + "/día", inline: true },
                { name: "Compras disp.", value: this.updateData(id, "buys", users, config, cards), inline: true },
                { name: "Rolls disp.", value: this.updateData(id, "rolls", users, config, cards), inline: true },
                { name: "Inversiones disp.", value: this.updateData(id, "invs", users, config, cards) , inline: true },
                { name: "Reacciones disp.", value: this.updateData(id, "reacts", users, config, cards), inline: true }
            );
    
        return ans;
    },

    updateData(id, data, users, config, cards) { // update a specific variable for a specific user

        let colInfo = this.collectionInfo(id, users, cards, config);
        let allRates = {...config.rates, bal: colInfo[colInfo.length - 1][3]}

        users[id][data][0] += allRates[data]*(Date.now() - users[id][data][1])/86400000; // add according to time since last update
        users[id][data][1] = Date.now(); // set last update time to now
        if (data == "bal") {

            users[id][data][2] = allRates["bal"];
            ans = Math.floor(Math.round(users[id][data][0]*100)/100)

        } else if (users[id][data][0] > config.ratesMax[data]) {

            users[id][data][0] = config.ratesMax[data]; // cap maximum stat for twice what you can get in a day
            ans = users[id][data][0];

        } else { ans = users[id][data][0] }


        return Math.floor(ans); // returns the updated value
    },
    
    addData(id, data, users, amount = -1) { // adds given amount to the stat
        users[id][data][0] += amount;
    },

    getNicks(config, id) { // find names associated with an id
        let ans = [];
        for (nick in config.nicks) {
            config.nicks[nick] == id ? ans.push(nick) : {}
        }
        return ans;
    },

    getActualId(nick, config) { // find id given a nick
        if (!isNaN(nick)) { // nick is already id
            return {success: true, id: nick};
        } else {
            if (nick in config.nicks) { // nick found
                return {success: true, id: config.nicks[nick]};
            } else { // nick not found
                return {success: false, id: "error"};
            }
        }
    },

    async idCorrection(argobj, preMessage, callback, isCollection = false, packCallback = undefined) { // for bal, buys, invs, reacts, col and user

        let { config, args, channel, nickname, act, id, cards } = argobj;

        let response, succeeded = true;

        if (act > 1) { // OTHER THAN JUST COL

            response = this.getActualId(args[1], config); // COL USER
            auxnickname = args[1];
            argobj.nickname = auxnickname;
            auxid = response.id;
            argobj.id = auxid;
            succeeded = response.success;

            if (isCollection) { // ONLY IF COLLECTION (RETURNS IF WORKS)
                if (act > 2) { // IF THERE IS ANOTHER WORD IT SHOULD BE A PACK (COL USER PACK)
                    if (succeeded) { // IS USER VALID?
                        if (args[2] in cards && args[2] !== "name") { // PACK IS GOOD
                            channel.send(await packCallback(argobj, args[2]));
                        } else { channel.send(`El pack \`${args[2]}\` no existe`); } // PACK INVALID
                    } else { channel.send(`El nombre \`${args[1]}\` no está registrado`); } // USER INVALID
                    return; // DONE
                } else if (!succeeded && args[1] in cards && args[1] !== "name") { // IF SECOND ARGUMENT IS NOT A USER; CHECK IF IT IS A PACK (COL PACK)
                    argobj.id = id;
                    argobj.nickname = nickname;
                    channel.send(await packCallback(argobj, args[1]));
                    return; // DONE
                } // else DO THE REST; USER IS DOING (COL USER)
            }

        }

        if (succeeded) {

            let callbackResult = await callback(argobj);
            let toSend;
            preMessage ? toSend = argobj.nickname + " tiene " + callbackResult : toSend = callbackResult;

            await channel.send(toSend);

        } else {
            await channel.send(`El nombre \`${args[1]}\` no está registrado`)
        }
    },

    ownerNick(cards, members, pk, cardIndex) {
        let ans = "-";
        let id = cards[pk][Cards.oFromC(cardIndex, cards[pk])][2];
        if (id) {
            try {
                ans = members.get(id).nickname; // get nick
            } catch (error) {
                console.log(error.message);
                ans = id;
            }
        }
        return ans;
    },

    getTop(users, config, cards, cache) {
        let us = [];
        let bals = [];
        for (u in users) {
            if (u == "name") {continue}
            au = users[u];
            let nick;
            try { nick = cache.members.get(u).nickname } catch(e) { nick = u }
            let colInfo = this.collectionInfo(u, users, cards, config);
            let bal = this.updateData(u, "bal", users, config, cards);
            if (bal > 0) {
                let cds = colInfo[colInfo.length - 1][0];
                let ind = Aux.indexOfCorrectInsertion(bal, bals);
                bals.splice(ind, 0, bal)
                us.splice(ind, 0, `**${nick}:** $${bal} - ${cds} cartas`)
            }
        }
        return us.reverse().join("\n");
    },

};

module.exports = Users;