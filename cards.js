const Aux = require("./auxtools"); // auxiliary, elementary functions
const Discord = require("discord.js"); // discord

const Cards = {

    maxValue: 20, // max value of all cards, used for coloring them

    totalCards(cards) {
        let ans = 0;
        for (col in cards) {
            if (col == "name") {
                continue;
            } else {
                ans += cards[col].length;
            }
        }
        return ans;
    },

    cardsInCommand(command) { // how much non text options are in a given command (accepts an array)
        let ans = 0;
        for (var i = 0; i < command.length; i++) {
            if (command[i][1] !== "txt") {
                ans++;
            }
        }
        return ans;
    },
    
    gifsInCommand(command) { // how much gif options are in a given command (accepts an array)
        let ans = 0;
        for (var i = 0; i < command.length; i++) {
            if (command[i][1] == "gif") {
                ans++;
            }
        }
        return ans;
    },
    
    cFromO(optionIndex, command) { // if option and card index don't match, convert using this (accepts array)
        let ans = optionIndex;
        for (var i = 0; i < optionIndex; i++) {
            if (command[i][1] == "txt") {
                ans--;
            }
        }
        return ans;
    },
    
    oFromC(cardIndex, command) { // if option and card index don't match, convert using this (accepts array)
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
    },
    
    getCardEmbed(cardIndex, command, commandName, ownerNickname) { // generate an embed for a card (command should be an array)
        let optionIndex = this.oFromC(cardIndex, command);
        let actualCard = command[optionIndex];
    
        let extraName = ""; // custom name
        if (actualCard[5]) {
            extraName = " - " + actualCard[5];
        }
    
        let ans = new Discord.MessageEmbed()
            .setColor(Aux.toRgb(actualCard[3], this.maxValue))
            .setTitle(Aux.capFirst(commandName) + " #" + (cardIndex + 1) + extraName)
            .addFields(
                { name: "Dueño", value: ownerNickname, inline: true },
                { name: "Valor", value: "$" + actualCard[3], inline: true },
                { name: "Multiplicador", value: "x" + actualCard[4], inline: true }
            )
            .setImage(actualCard[0])
            .setFooter((cardIndex + 1) + "/" + this.cardsInCommand(command) + " - id: " + commandName + " " + (optionIndex + 1));

        if (actualCard[6]) {
            ans.setDescription(actualCard[6]);
        }
        return ans;
    },
    
    findMaximumValue(cards) { // set maxValue as the price of the most expensive card to properly color them
        let ans = 100;
        for (key in cards) {
            if (key == "name") {
                continue;
            }
            for (var i = 0; i < cards[key].length; i++) {
                if (cards[key][i][3]*cards[key][i][4] > ans) {
                    ans = cards[key][i][3]*cards[key][i][4];
                }
            }
        }
        this.maxValue = ans;
    },
    
    getTop(cards) { // generate to list of top cards by value
        let ans = [];
        for (coll in cards) {
            if (coll == "name") {
                continue;
            } // skip attribute "name" of object cards
            for (var i = 0; i < cards[coll].length; i++) { // i is for the main loop
                if (cards[coll][1] !== "txt") {
                    for (var j = 0; j <= ans.length; j++) { // j is for the already existing ans, to know where to insert new cards
                        if (j == ans.length) { // if surpassed noone, go last
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
    },
    
    selectRandomCard(cards) { // selects a random card, used for rolls
        let ans; 
    
        let cardsInEach = {}; // calculates how many cards are in every command
        let total = 0; // calculates how many cards there are in total
        for (var card in cards) {
            if (card == "name") {
                continue;
            }
            cardsInEach[card] = this.cardsInCommand(cards[card]);
            total += this.cardsInCommand(cards[card]);
        }
    
        let preAns = Math.floor(Math.random() * total); // raw single number of which card to select
        let stepsTaken = 0; // this will stop when preAns == stepsTaken
        let found = false; // this will let know the loop when to break
    
        for (var card in cardsInEach) { // cycle through all cards
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
    
        return ans; // returns [pack name, number]
    },
    
    owners(array, cache) { // used for knowing if a set of cards (array) contains a card that has an owner. Returns the list of all owners.
        let ans = [];
        for (var i = 0; i < array.length; i++) {
            let nick;
            try {nick = cache.members.get(array[i][2]).nickname} catch(e) {nick = array[i][2]}
            if (nick && !ans.includes(nick)) { // don't double count
                ans.push(nick);
            }
        }
        return ans;
    },

    neighbour(direction, cache, cards, ownerNickname) {

        if (cache.isLastAvailable) {

            let commandName = cache.last.pack;
            let command = cards[commandName];

            let newIndex = cache.last.number + direction;
            let cInCmd = this.cardsInCommand( command );

            if (newIndex >= cInCmd) {
                newIndex = 0;
            } else if (newIndex < 0) {
                newIndex = cInCmd - 1;
            }

            return { message: this.getCardEmbed(newIndex, command, commandName, ownerNickname),
                     newIndex: newIndex,
                   }

        } else return { message: "Comando no disponible", newIndex: -1 }
    },

    getTop(cards, cache) {

        let top = [];
        let costs = [];
        for (c in cards) {
            if (c == "name") { continue }
            for (const [index, card] of cards[c].entries()) {
                let cost = card[3]*card[4];
                let ind = Aux.indexOfCorrectInsertion(cost, costs);
                let name;
                try { name = cache.members.get(card[2]).nickname } catch(e) { name = card[2] }
                top.splice(ind, 0, `**${Aux.capFirst(c)} #${this.cFromO(index, cards[c])+1}:** Valor: $${card[3]} - Multiplicador: x${card[4]} - Dueño: ${name}`);
                costs.splice(ind, 0, cost);
            }
        }
        return top.reverse().slice(0, 10).join("\n");
    },

};

module.exports = Cards;