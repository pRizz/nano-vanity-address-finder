const maxVanityLength = 64 - 5
const validCharsetRegex = /^[13456789abcdefghijkmnopqrstuwxyz]+$/ // modified base 32, https://github.com/nanocurrency/raiblocks/blob/master/rai/lib/numbers.cpp#L22

function isValidVanityString({ vanityString }) {
    if(!vanityString || vanityString.length > maxVanityLength) {
        return false
    }
    return validCharsetRegex.test(vanityString)
}

module.exports = {
    maxVanityLength,
    isValidVanityString
}