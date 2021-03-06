#!/usr/bin/env node
var path = require('path')
var http = require('http')
var program = require('commander')
var commandLineArgs = require('command-line-args')
var keypress = require('keypress')
var colors = require('colors')
var exec = require('child_process').exec
var execSync = require('child_process').execSync
var packageJSON = require(process.cwd() + '/package.json')

var parseData
var versionKeys
var package
var packagelen
var mode
var description
var author
var packageDependencies
var i = 0
var limit = 5
var pagination
var page = 1
var packageJSONDependenciesKey = Object.keys(packageJSON.dependencies || {})
var packageJSONDevDependenciesKey = Object.keys(packageJSON.devDependencies || {})
var t

const optionDefinitions = [
  { name: 'package', alias: 'p', defaultOption: true, multiple: true },
  { name: 'mode', alias: 'm' },
  { name: 'help' },
  { name: 'version', alias: 'V' }
]

const options = commandLineArgs(optionDefinitions)

package = options.package
mode = options.mode || 'save'

program
  .version('1.1.6')
  .usage('[options]')
  .option('-p --package', 'npm package name')
  .option('-m --mode', 'set dependencies mode, "dev" or "save")')
  .parse(process.argv)

keypress(process.stdin);

function walk(package) {
  console.log(`Link to http://registry.npmjs.org/${package}`)
  var req = http.get(`http://registry.npmjs.org/${package}`, function(res) {
    let data = ''
    res.setEncoding('utf8')
    res.on('data', (chunk) => data += chunk)
    res.on('end', () => {
      try {
        parseData = JSON.parse(data)
        versionKeys = Object.keys(parseData.versions)
        description = parseData.versions[versionKeys[i]].description
        author = parseData.versions[versionKeys[i]].author
        packageDependencies = parseData.versions[versionKeys[i]].dependencies
        pagination = Math.ceil(versionKeys.length / limit)
        callDown(versionKeys, 'new')
        process.stdin.on('keypress', function (ch, key) {
          adjustInfo()
          if (key === undefined) return
          switch(key.name) {
            case 'space':
              if (page + 1 > pagination) {
                return
              }
              i = page * (limit) - 1
              page++
              callDown(versionKeys)
            break;
            case 'down':
            case 'j':
              callDown(versionKeys)
              break
            case 'up':
            case 'k':
              callUp(versionKeys)
              break
            case 'l':
              if (mode === 'dev') {
                execSync(`yarn add --dev ${package}@latest`, (error, stdout, stderr) => {
                  console.log(stdout)
                })
              } else {
                execSync(`yarn add ${package}@latest`, (error, stdout, stderr) => {
                  console.log(stdout)
                })
              }
              exit()
            break
            case 'n':
              if (mode === 'dev') {
                execSync(`yarn add --dev ${package}@next`, (error, stdout, stderr) => {
                  console.log(stdout)
                })
              } else {
                execSync(`yarn add ${package}@next`, (error, stdout, stderr) => {
                  console.log(stdout)
                })
              }
              exit()
            break
            case 't':
              console.log(versionKeys)
            break
            case 'r':
              if (packageJSONDependenciesKey.indexOf(package) !== -1) {
                clear()
                t = twirlTimer(`remove ${package} v${packageJSON.dependencies[package]}..`)
                exec(`yarn remove ${package}`, (error, stdout, stderr) => {
                  stop_twirlTimer(t, stdout + "\n" + `remove ${package} version ${packageJSON.dependencies[package]} done...`)
                })
                exit()
              } else {
                console.log(`you didn't install ${package}`.red)
              }
            break
            case 'i':
              if (mode !== 'dev') {
                mode = 'dev'
              } else {
                mode = 'save'
              }
              callDown(versionKeys, 'void')
            break
            case 'v':
              execSync(`yarn --version`, (error, stdout, stderr) => {
                console.log(`yarn version ${stdout}`)
              })
            break
            case 'o':
              console.log(`open website: https://www.npmjs.com/package/${package}...`)
              exec(`open https://www.npmjs.com/package/${package}`)
            break
            case 'return':
              clear()
              t = twirlTimer(`install ${package} ${versionKeys[i]}..`)
              if (mode === 'dev') {
                exec(`yarn add --dev ${package}@${versionKeys[i]}`, (error, stdout, stderr) => {
                  stop_twirlTimer(t, stdout + "\n" + `${package} version ${versionKeys[i]} done...`)
                })
              } else {
                exec(`yarn add ${package}@${versionKeys[i]}`, (error, stdout, stderr) => {
                  stop_twirlTimer(t, stdout + "\n" + `${package} version ${versionKeys[i]} done...`)
                })
              }
              exit()
            break
            case 'u':
            clear()
            t = twirlTimer(`install ${package} ^${versionKeys[i]}..`)
            if (mode === 'dev') {
              exec(`yarn add --dev ${package}@^${versionKeys[i]}`, (error, stdout, stderr) => {
                stop_twirlTimer(t, stdout + "\n" + `${package} version ^${versionKeys[i]} done...`)
              })
            } else {
              exec(`yarn add ${package}@^${versionKeys[i]}`, (error, stdout, stderr) => {
                stop_twirlTimer(t, stdout + "\n" + `${package} version ^${versionKeys[i]} done...`)
              })
            }
            exit()
            break
          }
          if (key && key.ctrl && key.name == 'g') {
            clear()
            console.log(`Download https://registry.npmjs.org/${package}/-/${package}-${versionKeys[i]}.tgz ...`)
            execSync(`wget https://registry.npmjs.org/${package}/-/${package}-${versionKeys[i]}.tgz`, (error, stdout, stderr) => {
              console.log(stdout)
            })
            exit()
          }
          if (key && key.ctrl && key.name == 'd') {
            if (page < pagination) {
              i = i + 4
              page = page + 1
            }
            callDown(versionKeys)
          }
          if (key && key.ctrl && key.name == 'b') {
            if (page - 1 !== 0) {
              i = i - 4
              page = page - 1
            }
            callUp(versionKeys)
          }
          if (key && key.ctrl && key.name == 'c') {
            exit()
          }
        })
        process.stdin.setRawMode(true);
        process.stdin.resume();
      } catch (e) {
        console.log(`[select npm] >> Can't not find ${package}`)
      }
    })
  })
  req.on('error', function(e) {
    console.log(e)
  })

  req.end()
}

// main
packagelen = (typeof package === 'object' && package.length) > 1 ? package.length : 1
if (package && packagelen === 1 && package.length !== 0) {
  walk(package[0])
} else if (packagelen > 1) {
  clear()
  console.log(`Didn't support multiple package now.`)
} else {
  exec(`nyi --help`, (error, stdout, stderr) => {
    console.log(stdout)
  })
}

// util

function clear() {
  process.stdout.write('\033[2J')
  process.stdout.write('\033[0f')
}

function exit() {
  process.stdin.pause()
}

function adjustInfo() {
  description = parseData.versions[versionKeys[i]].description
  author = parseData.versions[versionKeys[i]].author
  packageDependencies = parseData.versions[versionKeys[i]].dependencies
}

function callDown(versionKeys, type) {
  clear()
  console.log(`---------------- choose ${package} install version, mode ${mode} ----------------`)
  if (i > versionKeys.length - 2) {
    i = versionKeys.length - 1
  } else if (!(i + 1 > versionKeys.length) && type === 'new' && type !== 'void') {
    i = 0
  } else if (!(i + 1 > versionKeys.length) && type !== 'twoway' && type !== 'void') {
    i++
  }
  if (i + 1 > page * limit) {
    page++
    callDown(versionKeys, 'twoway')
    clear()
    console.log(`---------------- choose ${package} install version, mode ${mode} ----------------`)
  }
  versionKeys.forEach((key, index) => {
    if (page === 1) {
      if (index >= page * limit) {
        return
      }
    } else {
      if (index < page * limit - 5 || index > page * limit - 1) {
        return
      }
    }
    if (index === i) {
      console.log('> install', key.underline.green)
    } else {
      console.log('install', key)
    }
  })
  var ar = []
  for(let i = 0; i < pagination; i++) {
    if (i === page - 1) {
      ar.push(`[${i+1}]`)
    } else {
      ar.push(i+1)
    }
  }
  console.log(`-------- ${ar.join(' ')} --------`)
  tips()
}

function callUp(versionKeys, type) {
  clear()
  console.log(`---------------- choose ${package} install version, mode ${mode} ----------------`)
  if (i === 0) {
    i = 0
  } else if (!(i - 1 < 0) && type !== 'twoway') {
    i--
  }
  if (i < page * limit - 4) {
    page--
    callDown(versionKeys, 'twoway')
    clear()
    console.log(`---------------- choose ${package} install version, mode ${mode} ----------------`)
  }
  versionKeys.forEach((key, index) => {
    if (index < page * limit - 5 || index > page * limit - 1) {
      return
    }
    if (index === i) {
      console.log('> install', key.underline.green)
    } else {
      console.log('install', key)
    }
  })
  var ar = []
  for(let i = 0; i < pagination; i++) {
    if (i === page - 1) {
      ar.push(`[${i+1}]`)
    } else {
      ar.push(i+1)
    }
  }
  console.log(`-------- ${ar.join(' ')} --------`)
  tips()
}

function tips() {
  console.log('')
  console.log('-- description --'.yellow)
  console.log(description ? description : '')
  console.log('-- author --'.yellow)
  console.log(author ? author : `${package} team`)
  console.log('-- dependencies --'.yellow)
  console.log(packageDependencies ? packageDependencies : {})
  console.log('-- local version --'.yellow)
  if (packageJSONDependenciesKey.indexOf(package[0]) !== -1) {
    console.log(`local version: ${packageJSON.dependencies[package[0]]}`.red)
  } else if (packageJSONDevDependenciesKey.indexOf(package[0]) !== -1) {
    console.log(`local version: ${packageJSON.devDependencies[package[0]]}`.red)
  } else {
    console.log(`${package} is not install`)
  }
  console.log('-- installation --'.yellow)
  console.log(`* press 'enter' to install choose version`)
  console.log(`* press 'u' to install above then choose version`)
  console.log(`* press 'l' to install latest version`)
  console.log(`* press 'n' to install next version`)
  console.log(`* press 'r' to remove package`)
  console.log(`* press 'i' to change install mode`)
  console.log('-- download package --'.yellow)
  console.log(`* press 'ctrl + g' to download tgz package`)
  console.log('-- selection --'.yellow)
  console.log(`* press 'space' or 'ctrl + d' to next pagination`)
  console.log(`* press 'ctrl + b' to pre pagination`)
  console.log(`* press 'j' to select next`)
  console.log(`* press 'k' to select pre`)
  console.log('-- document --'.yellow)
  console.log(`* press 'o' to open npm website`)
  console.log('-- exit --'.yellow)
  console.log(`* press 'ctrl + c' to exit`)
}

function twirlTimer(msg){
  return (function() {
    var P = ["\\", "|", "/", "-"];
    var x = 0;
    return setInterval(function() {
      process.stdout.write("\r" + msg.yellow + P[x++].yellow);
      x &= 3;
    }, 250);
  })();
}

function stop_twirlTimer(timer, msg){
  clearInterval(timer)
  process.stdout.clearLine()
  process.stdout.write("\r" + msg + "\n")
}
