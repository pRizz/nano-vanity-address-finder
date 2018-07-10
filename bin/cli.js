#!/usr/bin/env node

/*!
 * nano-vanity-address-finder
 * Copyright(c) 2018 Peter Ryszkiewicz
 * MIT Licensed
 */

const program = require('commander')
const packageJSON = require('../package')
const moment = require('moment')
const { performance } = require('perf_hooks');
const SeedFinder = require('..')
const VanityStringPosition = require('../src/VanityStringPosition')
const Common = require('../src/Common')

const initialCPUCount = require('os').cpus().length
let cpuCount = null
let vanityString = null
const chanceOfFindingOneCharVanityStringOnFirstTry = 1 / 32
let millisecondsPerComputation = 800 // initial estimate
const startTime = performance.now()

main()

function probabilityOfFindingSeedOnAnyTry({ vanityString }) {
  return Math.pow(chanceOfFindingOneCharVanityStringOnFirstTry, vanityString.length)
}

// FIXME: different for 'anywhere' search
function expectedComputationsForFindingVanitySeed({ vanityString, probability }) {
  return Math.ceil(Math.log(1 - probability)
    / Math.log(1 - probabilityOfFindingSeedOnAnyTry({ vanityString }))
  )
}

function millisecondsToCompute({ expectedComputations }) {
  return expectedComputations / cpuCount * millisecondsPerComputation
}

function localizedTimeToComputeForMilliseconds({ milliseconds }) {
  return moment().add(milliseconds, 'ms').fromNow()
}

function localizedTimeToCompute({ vanityString, probability }) {
  const expectedComputations = expectedComputationsForFindingVanitySeed({ vanityString, probability })
  const milliseconds = millisecondsToCompute({ expectedComputations })
  return localizedTimeToComputeForMilliseconds({ milliseconds })
}

function printEstimates() {
  console.log(`Estimated times for finding a seed:`)
  console.log(`There is a 50% chance of finding a seed ${localizedTimeToCompute({
    vanityString,
    probability: 0.5
  })}`)

  console.log(`There is a 95% chance of finding a seed ${localizedTimeToCompute({
    vanityString,
    probability: 0.95
  })}`)
}

// Defaults to prefix
function vanityStringPositionFor({ program }) {
  return program.suffix && VanityStringPosition.suffix || program.contains && VanityStringPosition.anywhere || VanityStringPosition.prefix
}

function main() {
  const timeouts = []

  program
    .version(packageJSON.version)
    .description(packageJSON.description)
    .option('-p, --prefix', 'search for the vanity string as a prefix of the address. This is the default search position.')
    .option('-s, --suffix', 'search for the vanity string as a suffix of the address.')
    .option('-c, --contains', 'search for the vanity string anywhere in the address.')
    .option('-a, --aggressive-CPU', 'use all available cores. By default, uses one less than all cores to reduce CPU starvation.')
    .option('-b, --half-CPU', 'only use half of available cores.')
    .arguments('<vanityString>')
    .action((_vanityString) => {
      vanityString = _vanityString
    })

  program.parse(process.argv)

  if(!vanityString) {
    console.error('Error: must supply a vanity string that you want your address to have!')
    program.help()
  }

  const searchTypeCount = (program.prefix ? 1 : 0) + (program.suffix ? 1 : 0) + (program.contains ? 1 : 0)

  if(searchTypeCount >= 2) {
    console.error('Error: must only supply one of [--prefix, --suffix, --contains]')
    program.help()
  }

  vanityString = vanityString.toLowerCase()

  if(!Common.isValidVanityString({ vanityString })) {
    console.error(`Error: must supply a vanity string that consists of the characters 13456789abcdefghijkmnopqrstuwxyz and not be greater than ${Common.maxVanityLength}!`)
    program.help()
  }

  if(program.aggressiveCPU && program.halfCPU) {
    console.error(`Error: cannot be both aggressive and half CPU!`)
    program.help()
  }

  if(program.aggressiveCPU) {
    cpuCount = initialCPUCount
  } else if(program.halfCPU) {
    cpuCount = initialCPUCount > 1 ? initialCPUCount / 2 : initialCPUCount
  } else {
    cpuCount = initialCPUCount > 1 ? initialCPUCount - 1 : initialCPUCount
  }

  let vanityStringPositionDescriptor = null
  const vanityStringPosition = vanityStringPositionFor({ program })
  switch(vanityStringPosition) {
    case VanityStringPosition.anywhere: vanityStringPositionDescriptor = 'containing'; break
    case VanityStringPosition.prefix: vanityStringPositionDescriptor = 'starting with'; break
    case VanityStringPosition.suffix: vanityStringPositionDescriptor = 'ending with'; break
    default: throw 'Unknown vanity string position'
  }

  console.log(`Searching for vanity seed that creates an address ${vanityStringPositionDescriptor} '${vanityString}', with ${cpuCount} processors.`)

  SeedFinder.eventEmitter.on('millisecondsPerCheck', (millisecondsPerCheck) => {
    millisecondsPerComputation = millisecondsPerCheck * cpuCount
  })

  console.log('Generating time estimate for finding seed...')
  timeouts.push(setTimeout(printEstimates, 20000))

  SeedFinder.findSeedAndAddressWith({ vanityString, vanityStringPosition, cpuCount }).then(({ vanitySeed, vanityAddress }) => {
    const endTime = performance.now()
    const duration = endTime - startTime
    const localizedDuration = moment().add(duration, 'ms').fromNow()
    console.log(`Found ${localizedDuration} (or ${duration}ms)!`)
    console.log(`Vanity address:`)
    console.log(vanityAddress)
    console.log(`Make sure to test out and securely save this seed before actually utilizing it!`)
    console.log(`Vanity seed:`)
    console.log(vanitySeed)
    timeouts.forEach(clearTimeout)
  })
}
