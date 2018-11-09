function retryAll(promises,maxTry){
    const succs = []
  const fails = []
  return new Promise((resolve, reject) => {
    const walkFn = (i,tryTime) => {
      if (i < promises.length) {
        promises[i].then(res => {
          succs.push({index:i,res:res})
          walkFn(++i,0)
        }).catch(err => {
          tryTime+=1
          if(tryTime<maxTry){
              console.log(i,'promise failed, will try',tryTime)
              walkFn(i,tryTime)
          }
          else{
            console.log(i,'promise failed after',maxTry,'try')
            fails.push({index:i,err:err})
            walkFn(++i,0)
          }
        })
      } else {
        resolve({ succs, fails })
      }
    }
    walkFn(0,0)
  })
}
module.exports= {retryAll}