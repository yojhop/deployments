const filePath='./1token-t0/package.json'
const fs = require('fs')
const verfile = fs.readFileSync(filePath, 'utf8')
let obj=JSON.parse(verfile)
obj.t0env='internal'
let pretty=JSON.stringify(obj,null,2)
fs.writeFileSync(filePath,pretty)