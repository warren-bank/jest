const path = require('path')

const dir = '/temp/project'

path.resolve = path.win32.resolve
console.log('win32:', path.resolve(dir))

path.resolve = path.posix.resolve
console.log('posix:', path.resolve(dir))

// output:
// -------
// win32: \temp\project
// posix: \temp\project
