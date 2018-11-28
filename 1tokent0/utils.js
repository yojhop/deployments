const {exec}=require('child_process')
// const child_process=require('child_process')
const { createHash } =require( "crypto")
const { createReadStream } =require ("fs")
const {retryAll}=require('./promiseUtils')

function cloneProject(){
    return new Promise((resolve,reject)=>{
        exec('git clone http://yojhop:cainiao97@github.com/qbtrade/1token-t0.git',(error, stdout, stderr) => {
            if (error) {
                reject(error)
            }
            else{
                resolve()
            }
            
        })
    })
}
function hashFile(file, algorithm = "sha512", encoding = "base64", options) {
    return new Promise((resolve, reject) => {
      const hash = createHash(algorithm)
      hash
        .on("error", reject)
        .setEncoding(encoding)
      createReadStream(file, {...options, highWaterMark: 1024 * 1024 /* better to use more memory but hash faster */})
        .on("error", reject)
        .on("end", () => {
          hash.end()
          resolve(hash.read())
        })
        .pipe(hash, {end: false})
    })
}
function produceHash(){
    return new Promise((resolve,reject)=>{
        readConfig().then(config=>{
            const filePath=`./1token-t0/build/1TokenT0-Setup-${config.version}.exe`
            const sha2Promise=hashFile(filePath,algorithm = "sha256",'hex')
            const sha512Promise=hashFile(filePath,algorithm = "sha512",'base64')
            Promise.all([sha2Promise,sha512Promise]).then(res=>{
                resolve(res)
            }).catch(err=>{
                reject(err)
            })
        }).catch(err=>{
            reject(err)
        })
    })
}
function saveHash(sha2,sha512){
    return new Promise((resolve,reject)=>{
        try{
            const filePath='./1token-t0/build/latest.yml'
            const fs = require('fs')
            const verfile = fs.readFileSync(filePath, 'utf8')
            yaml = require('js-yaml')
            console.log(verfile)
            let latest=yaml.safeLoad(verfile)
            latest.sha2=sha2
            latest.sha512=sha512
            latest.files[0].sha512=sha512
            fs.writeFileSync(filePath,yaml.safeDump(latest))
            resolve()
        }
        catch(err){
            reject(err)
        }
    })
}
function putFilesToOss(enviroment){
    return new Promise((resolve,reject)=>{
        let sourceFolder='./1token-t0/build'
    let OSSFolder
    switch(enviroment){
        case 'product':
            OSSFolder='t0-deploy/win32'
            break
        case 'test':
            OSSFolder='t0-test-deploy/win32'
            break
        case 'internal':
            OSSFolder='t0-internal-deploy/win32'
            break
    }
    let downLoadFolder='download'
    let OSS = require('ali-oss');
    let client = new OSS({
        endpoint: 'http://oss-cn-shanghai.aliyuncs.com',
        accessKeyId: 'xxx',
        accessKeySecret: 'aaa'
    })
    
    client.useBucket('otimg')
        readConfig().then(config=>{
            const fileNames=[`1TokenT0-Setup-${config.version}.exe`,`1TokenT0-Setup-${config.version}.exe.blockmap`,'releaseNotes.txt','latest.yml']
            try{
                const promises=[]
                for(let file of fileNames){
                    promises.push(client.put(`${OSSFolder}/${file}`, `${sourceFolder}/${file}`,{timeout:1800000}))
                }
                if(enviroment==='product'){
                    promises.push(client.put(`${downLoadFolder}/1TokenT0_Setup_v${config.version}.exe`, `${sourceFolder}/1TokenT0-Setup-${config.version}.exe`,{timeout:1800000}))
                }
                retryAll(promises,3).then(({ succs, fails })=>{
                    if(succs.length===4){
                        resolve()
                    }
                    else{
                        let msg=''
                        for(let fail of fails){
                            msg+=fileNames[fail.index]+' fail for '+fail.err+'\n'
                        }
                        reject(msg)
                    }
                })
            }
            catch(err){
                reject(err)
            }
        }).catch(err=>{
            reject(err)
        })
    })
}
function moveFiles(){
    let sourceFolder='./1token-t0/build'
    let destFolder='C:/Users/amos/Desktop/update server/public/win32'
    
    return new Promise((resolve,reject)=>{
        const fs = require('fs')
        readConfig().then(config=>{
            const fileNames=[`1TokenT0-Setup-${config.version}.exe`,`1TokenT0-Setup-${config.version}.exe.blockmap`,'latest.yml']
            try{
                for(let file of fileNames){
                    fs.writeFileSync(`${destFolder}/${file}`, fs.readFileSync(`${sourceFolder}/${file}`))
                }
                resolve()
            }
            catch(err){
                reject(err)
            }
        }).catch(err=>{
            reject(err)
        })
    })
    
}
function installDeploymentDeps(){
    return new Promise((resolve,reject)=>{
        exec('npm install',(error,stdout,stderr)=>{
            if(error){
                reject(error)
            }
            else{
                resolve()
            }
        })
    })
}
function installProjectDeps(){
    return new Promise((resolve,reject)=>{
        exec('cd ./1token-t0 && npm install',(error, stdout, stderr) => {
            if(error){
                reject(error)
            }
            else{
                resolve()
            }
        })
    })
}
function cloneServer(){
    return new Promise((resolve,reject)=>{
        exec('git clone http://yojhop:cainiao97@github.com/yojhop/T0UpdateServer.git',(error, stdout, stderr) => {
            if (error) {
                reject(error)
            }
            else{
                resolve()
            }
            
        })
    })
}
function installServerDeps(){
    return new Promise((resolve,reject)=>{
        exec('cd ./T0UpdateServer && npm install',(error, stdout, stderr) => {
            if(error){
                reject(error)
            }
            else{
                resolve()
            }
        })
    })
}
function pullT0Project(){
    return new Promise((resolve,reject)=>{
        exec('cd 1token-t0 && git checkout . && git pull',(error, stdout, stderr) => {
            if (error) {
                reject(error)
            }
            else{
                resolve()
            }
            
        })
    })
}
function buildT0(){
    return new Promise((resolve,reject)=>{
        exec('cd 1token-t0 && npm run build',(error, stdout, stderr) => {
            if (error) {
                reject(error)
            }
            else{
                resolve()
            }
        })
    })
}
function readConfig(){
    return new Promise((resolve,reject)=>{
        var fs = require("fs");
        fs.readFile('./1token-t0/package.json',  (err, data)=> {
            if (err) {
                reject(err)
            }
            else{
                resolve(JSON.parse(data.toString()))
            }
        })
    })
}
function sign(){
    return new Promise((resolve,reject)=>{
        readConfig().then(config=>{
            exec(`signtool sign /tr http://timestamp.digicert.com /td sha256 /fd sha256 /a "./1token-t0/build/1TokenT0-Setup-${config.version}.exe"`,(error, stdout, stderr) => {
                if (error) {
                    reject(error)
                }
                else{
                    resolve()
                }
            })
        }).catch(err=>{
            reject(err)
        })
    })
}

module.exports= {putFilesToOss,moveFiles,saveHash,produceHash,installDeploymentDeps,cloneProject,installProjectDeps,cloneServer,installServerDeps,sign,readConfig,buildT0,pullT0Project}