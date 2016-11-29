#!/usr/bin/env node
var http = require('http')
var keypress = require('keypress')
var colors = require('colors')
var exec = require('child_process').exec

var package = process.argv[1]
var mode = process.argv[2] === 'dev' ? '--dev' : 'save'
var i = 0;
var limit = 5;
var pagination;
var page = 1;

keypress(process.stdin);
console.log(`Link to http://registry.npmjs.org/${package}`)
var req = http.get(`http://registry.npmjs.org/${package}`, function(res) {
  let data = ''
  res.setEncoding('utf8')
  res.on('data', (chunk) => data += chunk)
  res.on('end', () => {
    try {
      let parseData = JSON.parse(data)
      var versionKeys = Object.keys(parseData.versions)
      pagination = Math.ceil(versionKeys.length / limit)
      callDown(versionKeys, 'new')
      process.stdin.on('keypress', function (ch, key) {
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
            callDown(versionKeys)
            break
          case 'up':
            callUp(versionKeys)
            break
          case 'l':
            if (mode === 'dev') {
              exec(`yarn add --dev ${package}@latest`, (error, stdout, stderr) => {
                console.log(stdout)
              })
            } else {
              exec(`yarn add ${package}@latest`, (error, stdout, stderr) => {
                console.log(stdout)
              })
            }
            exit()
          break
          case 'n':
            if (mode === 'dev') {
              exec(`yarn add --dev ${package}@next`, (error, stdout, stderr) => {
                console.log(stdout)
              })
            } else {
              exec(`yarn add ${package}@next`, (error, stdout, stderr) => {
                console.log(stdout)
              })
            }
            exit()
          break
          case 't':
            console.log(versionKeys)
          break
          case 'r':
            clear()
            console.log(`remove ${package} ${versionKeys[i]}..`)
            exec(`yarn remove ${package}`, (error, stdout, stderr) => {
              console.log(stdout)
            })
          exit()
          break
          case 'v':
            exec(`yarn --version`, (error, stdout, stderr) => {
              console.log(`yarn version ${stdout}`)
            })
          break
          case 'return':
            clear()
            console.log(`install ${package} ${versionKeys[i]}..`)
            if (mode === 'dev') {
              exec(`yarn add --dev ${package}@${versionKeys[i]}`, (error, stdout, stderr) => {
                console.log(stdout)
              })
            } else {
              exec(`yarn add ${package}@${versionKeys[i]}`, (error, stdout, stderr) => {
                console.log(stdout)
              })
            }
            exit()
          break
        }
        if (key && key.ctrl && key.name == 'd') {
          if (mode !== 'dev') {
            mode = 'dev'
          } else {
            mode = 'save'
          }
          callDown(versionKeys, 'new')
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

function clear() {
  process.stdout.write('\033[2J')
  process.stdout.write('\033[0f')
}

function exit() {
  process.stdin.pause()
}

function callDown(versionKeys, type) {
  clear()
  console.log(`---------------- choose ${package} install version, mode ${mode} ----------------`)
  if (i > versionKeys.length - 2) {
    i = versionKeys.length - 1
  } else if (!(i + 1 > versionKeys.length) && type === 'new') {
    i = 0
  } else if (!(i + 1 > versionKeys.length) && type !== 'twoway') {
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
  console.log('')
  console.log(`* press space to next pagination`)
  console.log(`* press enter to install choose version`)
  console.log(`* press 'l' to install latest version`)
  console.log(`* press 'n' to install next version`)
  console.log(`* press 'r' to remove package`)
  console.log(`* press 'ctrl + d' to change install mode`)
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
  console.log('')
  console.log(`* press space to next pagination`)
  console.log(`* press enter to install choose version`)
  console.log(`* press 'l' to install latest version`)
  console.log(`* press 'n' to install next version`)
  console.log(`* press 'r' to remove package`)
  console.log(`* press 'ctrl + d' to change install mode`)
}
