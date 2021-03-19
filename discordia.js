const DiscordFunctions = {

    async reset(client) { // reset connection to discord, does not affect database or other
        await client.destroy();
        console.log("Logged out from Discord. Re-logging...");
        await client.login(process.env.DISCORD_TOKEN);
        console.log("Connection to Discord re-established!");
    },
    
    async updatePresence(client, prefix) { // update status of bot
        try {
            await client.user.setPresence({
            status: "online",
            activity: {
                name: prefix + "help",
                type: "LISTENING"
            }
        });
        } catch(error) {
            console.log("ERROR: Could not set presence");
        }
    }

};

module.exports = DiscordFunctions;