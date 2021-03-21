import { hsv } from "color-convert"
import { RGB } from "color-name"

export default class Util {
    
    static upperFirst(string: string): string {
        return string.charAt(0).toUpperCase() + string.slice(1)
    }

    static valueToRgb(value: number): RGB { /* Value must be in the range [0, 1] */
        let hue: number = 360 * value - 50
        hue < 0 ? hue += 360 : {}
        let saturation: number = hue * 120
        return hsv.rgb([hue, saturation, saturation])
    }

}