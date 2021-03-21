const MF = require("./mainfunctions"); // main command handler
const MR = require("./mainreactions"); // main reaction handler




async function Main(cards, config, users, msg, client, pool, cache, isMessageOrReaction, reaction = undefined, user = undefined, storage) {

    cache.thereWasChange = true; // used for autosave

    let argobj, args, prefix, main;

    if (isMessageOrReaction) {

        args = msg.content.split(" ");
        prefix = config["prefix"];
        main = args[0].substring(prefix.length);

        argobj = {

            cards: cards,
            config: config,
            users: users,
            storage: storage,

            client: client,
            pool: pool,
            cache: cache,

            prefix: prefix, // command prefix

            channel: msg.channel, // channel object of where the message was sent
            guild: msg.guild, // guild object where message was sent

            args: args, // arguments as an array (including main)
            act: args.length, // how many arguments are in the command
            main: main, // first argument, equivalent to (main) command

            nickname: msg.member.nickname, // nickname of user who sent the message as a guild member
            id: msg.author.id, // id of user who sent message
            username: msg.author.username, // username of user who sent message

        }

    } else {

        argobj = {

            cards: cards,
            config: config,
            users: users,

            client: client,
            pool: pool,
            cache: cache,

            prefix: prefix,

            channel: reaction.message.channel,
            guild: reaction.message.guild,

            msg: reaction.message,
            id: user.id,
            username: user.username,
            emoji: reaction.emoji.name,

            isBot: user.bot,

        }

    }

    let u;
    if (isMessageOrReaction) {u = msg.author} else {u = user}

    let id = argobj.id;
    if (!(id in users) && !u.bot) { // create new user object if there is a new user and is not a bot
        console.log("Creating a new user (id" + id + ")...");
        users[id] = {
            col: {},
            bal: [config.baseCardValue, Date.now(), 0],
            invs: [1000, Date.now()],
            reacts: [1000, Date.now()],
            buys: [1000, Date.now()],
            rolls: [1000, Date.now()],
        }
        for (c in cards) {
            if (c == "name") {continue}
            users[id]["col"][c] = [];
            for (let i = 0; i < cards[c].length; i++) {
                users[id]["col"][c].push(false);
            }
        }
    }

    if (cache.guild !== argobj.guild) {cache.guild = argobj.guild; cache.members = await argobj.guild.members.fetch()} // cache guild

    if (isMessageOrReaction) { //COMMAND HANDLER

        if (args[0].startsWith(prefix) && main.length > 0) { // only do something when the message starts with a prefix and main exists

            if (main in MF && main !== "custom") { // only main commands

                MF[main.toLowerCase()](argobj);

            } else if (main in cards && main !== "name") { // custom commands

                MF["custom"](argobj);

            } else {

                argobj.channel.send(`El comando \`${main}\` no existe`);

            }

        }

    } else { //REACTION HANDLER

        MR(argobj);

    }

    if ((main in cards && main != "name" && args[1] == "-") || u.bot) {} else {
        cache.waitingForConfirm.status = false;
    }

}

module.exports = Main;