# nano-vanity-address-finder

[![Greenkeeper badge](https://badges.greenkeeper.io/pRizz/nano-vanity-address-finder.svg)](https://greenkeeper.io/)

Finds NANO seeds that generate the desired addresses. Utilizes parallelism to find the seed as quickly as possible.

## Usage as Library

In project directory:
```bash
npm i nano-vanity-address-finder
```
Then in code:
```javascript
const SeedFinder = require('nano-vanity-address-finder')

SeedFinder.findSeedAndAddressWith({ vanityString, vanityStringPosition, cpuCount }).then(({ vanitySeed, vanityAddress }) => {
    console.log(vanitySeed)
    console.log(vanityAddress)
})
```

## Command Line Usage

Install globally from npm with:
```bash
npm i -g nano-vanity-address-finder
```

or install globally from GitHub with:
```bash
npm i -g pRizz/nano-vanity-address-finder
```

Usage:
```
> nano-vanity-address-finder --help

  Usage: nano-vanity-address-finder [options] <vanityString>

  Finds NANO seeds that generate the desired addresses

  Options:

    -V, --version         output the version number
    -p, --prefix          search for the vanity string as a prefix of the address. This is the default search position.
    -s, --suffix          search for the vanity string as a suffix of the address.
    -c, --contains        search for the vanity string anywhere in the address.
    -a, --aggressive-CPU  use all available cores. By default, uses one less than all cores to reduce CPU starvation.
    -b, --half-CPU        only use half of available cores.
    -h, --help            output usage information

```

To find an address with a vanity prefix:
```bash
nano-vanity-address-finder --prefix myvanity
```
To find an address with a vanity suffix:
```bash
nano-vanity-address-finder --suffix myvanity
```
To find an address containing a vanity string:
```bash
nano-vanity-address-finder --contains myvanity
```

## Example Cost

My NANO address with suffix `prizz`,
```
xrb_3fwbzdazf6wmmy17agkzp47f75d5hdm5m91bxexp9auowm8m9a7tsk8prizz
```
took only an hour to find using an AWS `c5.18xlarge` instance, which costed about $3.

Longer vanity strings will, of course, take longer and cost more to find.

## Security

All seeds are generated with the proper cryptographic functions. Nothing is sent to any backend, but to ensure this, turn off your internet while searching for a seed and uninstall the tool afterwards.

If you want to output to a file instead of standard out, then just redirect the output like so:
```bash
nano-vanity-address-finder --contains myvanity > vanityOutput.txt
```

## MIT Licensed

## Tips
All tips are greatly appreciated and help me, Peter Ryszkiewicz, aka `pRizz`, support the development of more apps.

IOTA: `PRIZ9SWUXJLZKRPUYESORIZXVANRQUUGURDE9HXWOLNLGJOQHQSVEQYUM9GJTTAVKKTSUDWKCCBLCMAFAQARGOXPXW`

NANO: `xrb_3fwbzdazf6wmmy17agkzp47f75d5hdm5m91bxexp9auowm8m9a7tsk8prizz`
