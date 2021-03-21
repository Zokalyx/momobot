import Card from "./card"
import User from "./user"

interface data {
    users: {[key: string]: User}
    cards: {[key: string]: Array<Card>}
    config: {
        economy: {
            startingMoney: number
            rates: {
                [key: string]: number
                reacts: number
                rolls: number
                invs: number
                buys: number
            }
            max: {
                [key: string]: number
                reacts: number
                rolls: number
                invs: number
                buys: number
            }
        }
        card: {
            baseValue: number
            baseRarity: number
            gifRarityMultiplier: number
        }
    }
    storage: {
        topCardValue: number
    }
}

export default class Data {

    static data: data

}