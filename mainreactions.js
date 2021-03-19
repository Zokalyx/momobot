const Users = require("./users");
const MF = require("./mainfunctions");
const Cards = require("./cards");
const AuxTools = require("./auxtools");
const Texts = require("./messages");

async function MR ( {cards, config, users, msg, client, pool, cache, id, username, channel, guild, isBot, emoji} ) {
    if (!isBot) { // ignore own reactions
        let nickname = cache.members.get(id).displayName; // get nick

        if (msg == cache.boardMsg && !cache.game.ended) { // game logic

            if (cache.gameName = "c4") {
                let p;
                if (cache.game.turn == 1) {
                    p = "a";
                } else { p = "b";}
                if (cache.game[p] == "") { // NO USER YET!
                    cache.game[p] = nickname; // set name
                } 
                if (cache.game[p] == nickname) {
                    cache.game.act(Texts.regionals.indexOf(emoji)); // act accordingly
                    cache.board.setDescription(cache.game.renderBoard()).setTitle(cache.game.renderTitle());
                    cache.boardMsg.edit(cache.board);;
                }
            }

        } else { // card logic
            let isRolled = false;
            let pk, num, cObj;
            for (c of cache.rollCache) { // check if reacted message is in cache
                if (msg == c.msg) {
                    isRolled = true;
                    pk = c.card[0];
                    num = c.card[1];
                    cObj = c;
                    break;
                }
            }
            if (isRolled) {
                if (emoji == "💰") { // buy
                    if (cards[pk][Cards.oFromC(num, cards[pk])][2] != "") { channel.send(`La carta ${AuxTools.capFirst(pk)} #${num + 1} ya tiene dueño`) } else {

                        MF["buy"](cards, users, config, cObj, id, channel, cache);

                    }
                } else if (Texts.reactions.includes(emoji)) { // react
                    if (cards[pk][Cards.oFromC(num, cards[pk])][2] == id) { channel.send(`No podés reaccionar a una carta tuya`) } else {

                        MF["react"](cards, users, config, cObj, id, channel, cache, nickname);

                    }
                }
            }
        }
    }
};

module.exports = MR;