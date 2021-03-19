const Cards = require("./cards");
const Users = require("./users");

module.exports = function (users, cards, config) {

    for (pack in cards) {
        if (pack == "name") {continue}
        let arr = cards[pack];
        let arrLen = arr.length;
        for (u in users) {
            if (u == "name") {continue}
            users[u]["col"][pack] = [];
            for (let i = 0; i < arrLen; i++) {
                users[u]["col"][pack].push(false);
            }
        }
        for (let i = 0; i < arrLen; i++) {
            let id = arr[i][2];
            for (u in users) {
                if (id == u) {
                    users[u]["col"][pack][i] = true;
                    break;
                }
            }
        }
    }

}