import { MessageEmbed } from "discord.js"
import Util from "./util"

let { cards, config, users, storage } = global.data

interface cardInput { /* Input for Card constructor */
    pack: string
    id: number
    content: string
    owner?: string
    value?: number
    multiplier?: number
    rarity?: number
    name?: string
    description?: string    
}

export default class Card { /* Command option */

    pack: string
    id: number
    content: string
    owner: string
    value: number
    multiplier: number
    rarity: number
    name: string
    description: string
    type: string
    isCard: boolean

    constructor( {pack, id, content, rarity = 0, owner = "", value = 0, multiplier = 1, name = "", description = ""}: cardInput ) {
    
        this.pack = pack
        this.id = id
        this.content = content
        this.rarity = rarity
        this.owner = owner
        this.value = value
        this.multiplier = multiplier
        this.name = name
        this.description = description
        
        let imageTypes = [".png", ".jpg", ".jpeg", ".gif"]
        let foundImage: boolean = false
        this.type = ""
        for (const img of imageTypes) {
            if (content.includes(img)) {
                let sliceAt: number = content.search(img)
                content = content.slice(0, sliceAt + img.length)
                if (img === ".gif") {
                    this.type = "gif"
                } else {
                    this.type = "img"
                }
                foundImage = true
                break
            } else {
                this.type = "txt"
            }
        }

        /*if (this.type === "gif" && content.includes("tenor") && !content.endsWith(".gif")) {
            let gifRequest: {success: boolean, content: string} // = Request gif from tenor
            if (gifRequest.success) {
                this.type = "gif"
                this.content = gifRequest.content
            } else {
                this.type = "txt"
                this.content = "error"
            }
        }*/

        this.isCard = this.type === "txt" ? false : true

        if (rarity === 0) { /* If rarity is not defined, will use type to set a value */
            if (this.type === "img") {
                this.rarity = config.card.baseRarity
            } else if (this.type === "gif") {
                this.rarity = config.card.gifRarityMultiplier
            }
        }

    }

    getEmbed(): MessageEmbed {
        let nickname: string = this.owner === "" ? "-" : users[this.owner].getName()
        return new MessageEmbed()
            .setTitle(`${Util.upperFirst(this.pack)} #${this.id+1}` + this.name === "" ? "" : ` - ${this.name}`)
            .setDescription(this.description)
            .setImage(this.content)
            .setColor(Util.valueToRgb(this.value/storage.topCardValue))
    }

    static getTop(): Array<Card> {
        let totalArray: Array<Card> = []
        for (const pack in cards) {
            for (const card of cards[pack]) {
                totalArray.push(card)
            }
        }
        return totalArray.sort( (a, b) => a.value*a.multiplier - b.value*b.multiplier )
    }
}