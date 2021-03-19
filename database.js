let Cards = require("./cards");

const DatabaseFunctions = {

    async file(object, mode, pool) { // write or read and object to and from the database, returns read data
        let stringy = JSON.stringify(object); // object converted to string to be saved
        let name = object["name"]; // use .name property to know which object is being processed
        const database = await pool.connect();
    
        if (mode == "r") { // read mode
            let response = await database.query("SELECT value FROM " + name + ";");
            let jsonRead = await response["rows"][0]["value"];
            console.log("Object '" + name + "' loaded");
            database.release();
            return jsonRead;
    
        } else if (mode == "w") { // write mode
            await database.query("UPDATE " + name + " SET value = '" + stringy + "';");
            console.log("Object '" + name + "' saved");
            database.release();
            return object;
        }
    },

};

DatabaseFunctions.fileAll = async function (cards, config, users, mode, pool, storage) { // save or read all dicts
    let ans = {
        cards: await DatabaseFunctions.file(cards, mode, pool),
        config: await DatabaseFunctions.file(config, mode, pool),
        users: await DatabaseFunctions.file(users, mode, pool),
        storage: await DatabaseFunctions.file(storage, mode, pool),
    }
    
    Cards.findMaximumValue(ans.cards); // find the card with maximum value to appropiately display colors

    return ans
}

DatabaseFunctions.doInterval = function (cards, config, users, cache, pool, storage) {

    setInterval(async function() { // autosave if there was any change

                    if (cache.thereWasChange) {
                        cache.thereWasChange = false;
                        console.log("Saving due to auto-save...");
                        await DatabaseFunctions.fileAll(cards, config, users, "w", pool, storage);
                    }

                }, config.autosaveFrequency);

}

module.exports = DatabaseFunctions;