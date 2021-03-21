import Discord from "discord.js"
import { Pool } from "pg"
import Card from "./src/card"
import User from "./src/user"
import Database from "./src/database"
import data from "./src/data"

const pool: Pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
})
/*Database.file("r", pool).then(val => { 
    Object.assign(data, val)
})*/

