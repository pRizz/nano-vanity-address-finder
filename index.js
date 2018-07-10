/*!
 * nano-vanity-address-finder
 * Copyright(c) 2018 Peter Ryszkiewicz
 * MIT Licensed
 */

let cpuCount = require('os').cpus().length
const { fork } = require('child_process')
const EventEmitter = require('events')
const { performance } = require('perf_hooks')
const VanityStringPosition = require('./src/VanityStringPosition')
const Common = require('./src/Common')

const workers = []
let searching = false
const eventEmitter = new EventEmitter()
let startTime = null
let checks = 0
let millisecondsPerCheck = 0

let timerDelay = 3000
let timeout = null

function makeVanitySeedPromise() {
    return new Promise((resolve) => {
        for(let i of [...Array(cpuCount).keys()]) {
            const worker = fork('./src/VanityAddressFinderWorker.js')
            worker.on('message', (message) => {
                if(message.check) {
                    checks += 1
                    return
                }
                if(message.vanitySeed && message.vanityAddress) {
                    workers.forEach((worker) => {
                        worker.kill()
                    })
                    searching = false
                    clearTimeout(timeout)
                    resolve(message)
                    return
                }
            })
            workers.push(worker)
        }
    })
}

async function findSeedAndAddressWith({ vanityString, vanityStringPosition = VanityStringPosition.prefix, cpuCount: _cpuCount = 0 }) {
    if(!vanityString) { throw 'Missing vanityString' }
    if(!Common.isValidVanityString({ vanityString })) {
        throw `Error: must supply a vanity string that consists of the characters 13456789abcdefghijkmnopqrstuwxyz and not be greater than ${Common.maxVanityLength}!`
    }

    if(searching) {
        throw 'Can only search for one address at a time'
    }
    searching = true
    if(_cpuCount >= 1) {
        cpuCount = _cpuCount
    }

    const vanitySeedPromise = makeVanitySeedPromise()

    startTime = performance.now()
    workers.forEach((worker) => {
        worker.send({ vanityString, vanityStringPosition })
    })
    makeTimeout()
    return await vanitySeedPromise
}

function makeTimeout() {
    timerDelay *= 1.5
    timeout = setTimeout(() => {
        millisecondsPerCheck = (performance.now() - startTime) / (checks || 1)
        eventEmitter.emit('millisecondsPerCheck', millisecondsPerCheck)
        makeTimeout()
    }, timerDelay)
}

module.exports = {
    findSeedAndAddressWith,
    eventEmitter
}