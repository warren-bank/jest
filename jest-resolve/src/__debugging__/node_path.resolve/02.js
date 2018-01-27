const path = require('path')

const dir = '/temp/project'

console.log('posix:', path.posix.resolve(dir))

path.resolve = path.win32.resolve

console.log('posix:', path.posix.resolve(dir))

// output:
// -------
// posix: /temp/project
// posix: \temp\project
