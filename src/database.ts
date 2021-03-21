import { Pool } from "pg"
import Data from "./data"

export default class Database {

    static async file(mode: string, pool: Pool) {
        const database = await pool.connect()

        if (mode === "r") {
            let response = await database.query("SELECT value FROM data;")
            database.release()
            console.log("Data loaded")
            return response["rows"][0]["value"]
        } else if (mode === "w") {
            let stringy: string = JSON.stringify(Data.data)
            await database.query(`UPDATE data SET value = '${stringy}'`)
            database.release()
            console.log("Data saved")
        }
    }

}