# NYI (Npm Yarn Install)

![](https://media.giphy.com/media/l2JhCwrQ9O0svNTpK/giphy.gif)

npm yarn install TUI interface

# Installation

```command
> npm install nyi --global
```

# Use
```command
> nyi -p react -m save
```

# Options
```command
> nyi --help
Usage: index [options]

Options:
-h, --help     output usage information
-V, --version  output the version number
-p --package   npm package name
-m --mode      set dependencies mode, "dev" or "save")
```

# Keybind
```command
-- now version --

react is not install

-- installation --

* press 'enter' to install choose version
* press 'u' to install above than choose version (^0.0.1)
* press 'l' to install latest version
* press 'n' to install next version
* press 'r' to remove package
* press 'i' to change install mode

-- download package --

* press 'ctrl + g' to download tgz package

-- selection --

* press 'space' or 'ctrl + d' to next pagination
* press 'ctrl + b' to pre pagination
* press 'j' to choose next version
* press 'k' to choose pre version

-- document --

* press 'o' to open npm website

-- exit --

* press 'ctrl + c' to exit
```
