/*!
 * nano-vanity-address-finder
 * Copyright(c) 2018 Peter Ryszkiewicz
 * MIT Licensed
 */

const crypto = require('crypto')
const nanoLib = require('nano-lib')

const VanityStringPosition = require('./VanityStringPosition')

const defaultNANOPrefixLength = 'xrb_1'.length // or xrb_3

// TODO: Optimize
function generateSeed() {
    return [...Array(64)].map(() => (function getRandomChar() { return 'ABCDEF0123456789'[crypto.randomBytes(1)[0]] || getRandomChar() })()).join('')
}

function getSeedAndAddressForVanityString({ vanityString, vanityPredicate }) {
    let vanitySeed = null
    let vanityAddress = null
    do {
        const seed = generateSeed()
        const address = getSingleAddressFromSeed({ seed })
        if(vanityPredicate(address, vanityString)) {
            vanitySeed = seed
            vanityAddress = address
        }
        process.send({ check: true })
    } while(!vanitySeed)

    return { vanitySeed, vanityAddress }
}

function getSingleAddressFromSeed({ seed }) {
  const seedBuffer = Buffer.from(seed, 'hex')
  return nanoLib.address.fromSeed(seedBuffer).address
}

function vanityPredicateForPosition({ vanityStringPosition }) {
    switch (vanityStringPosition) {
        case VanityStringPosition.anywhere: return (address, vanityString) => address.includes(vanityString)
        case VanityStringPosition.prefix: return (address, vanityString) => address.substring(defaultNANOPrefixLength).startsWith(vanityString)
        case VanityStringPosition.suffix: return (address, vanityString) => address.endsWith(vanityString)
    }
    throw 'Error: unknown vanity position'
}

process.on('message', async (message) => {
    const { vanityString, vanityStringPosition } = message
    const vanityPredicate = vanityPredicateForPosition({ vanityStringPosition })
    const vanitySeedAndAddress = getSeedAndAddressForVanityString({ vanityString, vanityPredicate })

    process.send(vanitySeedAndAddress)
})

