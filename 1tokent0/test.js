const { createHash } =require('crypto')
function hashQuickPass() {
//   return new Promise((resolve, reject) => {
  const hash = createHash('sha512')
  hash.setEncoding('base64')
  hash.update('123')
  console.log(hash.digest('hex'))
  //hash.update('456')
  //console.log(hash.digest('hex'))
  //return hash('test')
//   })
}
hashQuickPass()
hashQuickPass()