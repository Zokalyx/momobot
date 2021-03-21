import { MessageEmbed } from "discord.js"
import data from "./data"

let { cards, config, users, storage } = data

let economyNames: Array<String> = ["bal", "reacts", "buys", "invs", "rolls"]

interface initials {
    [key: string]: number
    bal: number
    reacts: number
    buys: number
    invs: number
    rolls: number
}
interface commonEconomy {
    amount: number
    lastChecked: number
}

export default class User {

    id: string
    nicks: Array<string>
    collection: {[key: string]: Array<number>}
    economy: {
        [key: string]: commonEconomy
    }

    constructor(id: string, nicks: Array<string> = [], initials: initials = {bal: -1, reacts: -1, buys: -1, invs: -1, rolls: -1}) {

        this.id = id
        this.nicks = nicks
        this.economy = {}
        for (const key in initials) {
            if (initials[key] === -1) {
                if (key === "bal") {
                    initials[key] = config.economy.startingMoney
                } else {
                    initials[key] = config.economy.max[key]
                }
            }
            this.economy[key] = {amount: initials[key], lastChecked: Date.now()}
        }
        this.collection = {}
        for (const pack in cards) {
            this.collection[pack] = []
        }

    }

    getName(): string {
        return "asd"
    }

}
