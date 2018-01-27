const path = require('path')

const backup = {
  "posix": path.posix.resolve,
  "win32": path.win32.resolve
}

console.log(path.resolve instanceof Function,       '=>', 'path.resolve instanceof Function')
console.log(path.posix.resolve instanceof Function, '=>', 'path.posix.resolve instanceof Function')
console.log(path.win32.resolve instanceof Function, '=>', 'path.win32.resolve instanceof Function')
console.log()
console.log(path.resolve === path.posix.resolve, '=>', 'path.resolve === path.posix.resolve')
console.log(path.resolve === path.win32.resolve, '=>', 'path.resolve === path.win32.resolve')
console.log(path.posix.resolve === path.win32.resolve, '=>', 'path.posix.resolve === path.win32.resolve')
console.log(backup.posix === backup.win32, '=>', 'backup.posix === backup.win32')
console.log()

path.resolve = path.win32.resolve

console.log(path.resolve === path.posix.resolve, '=>', 'path.resolve === path.posix.resolve')
console.log(path.resolve === path.win32.resolve, '=>', 'path.resolve === path.win32.resolve')
console.log(path.posix.resolve === path.win32.resolve, '=>', 'path.posix.resolve === path.win32.resolve')
console.log(backup.posix === backup.win32, '=>', 'backup.posix === backup.win32')
console.log()

// output:
// -------
// true  => path.resolve instanceof Function
// true  => path.posix.resolve instanceof Function
// true  => path.win32.resolve instanceof Function
//
// true  => path.resolve === path.posix.resolve
// false => path.resolve === path.win32.resolve
// false => path.posix.resolve === path.win32.resolve
// false => backup.posix === backup.win32
//
// true  => path.resolve === path.posix.resolve
// true => path.resolve === path.win32.resolve
// true => path.posix.resolve === path.win32.resolve
// false => backup.posix === backup.win32
