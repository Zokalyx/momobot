const convert = require('color-convert'); // color for embeds
const DatabaseFunctions = require("./database");

const AuxTools = {
    
    recognizeType(entry) { // recognizes the type of a string (txt, gif or img)
        let ans = "txt";
        if (entry.indexOf(" ") < 0 && entry.startsWith("http")) {
            if (entry.endsWith("gif")) {
                ans = "gif";
            } else {
                ans = "img";
            }
        }
        return ans;
    },
    
    capFirst(string) { // capitalizes the first letter, used for collection names
        return (string.charAt(0).toUpperCase() + string.slice(1));
    },
    
    toRgb(value, maxValue) { // gets rgb to color a card according to its value
        let value1 = (value/maxValue * 360 - 50) % 360;
        if (value1 < 0) {
            value1 += 360;
        }
        let value2 = value/maxValue * 120;
        if (value2 > 100) {
            value2 = 100;
        }
        return convert.hsv.rgb(value1, value2, value2);
    },

    indexOfCorrectInsertion(value, array) { // know in which index a value should go in an sorted array
        let ans = 0;
        for (var i = 0; i < array.length; i++) {
            if (value > array[i]) {
                ans = i + 1;
            }
        }
        return ans;
    },

    chunk(arr, maxSize) {
        let ans = [];
        if (arr.length > maxSize) {
            let first = arr.slice(0, maxSize);
            let rest = arr.slice(maxSize);
            ans = [ first, ...this.chunk(rest) ];
        } else {
            ans = [ arr ];
        }
        return ans;
    }

};

module.exports = AuxTools;