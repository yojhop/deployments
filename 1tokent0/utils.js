const {exec}=require('child_process')
// const child_process=require('child_process')
const { createHash } =require( "crypto")
const { createReadStream } =require ("fs")
const {retryAll}=require('./promiseUtils')

function cloneProject({project,user,password}){
    return new Promise((resolve,reject)=>{
        exec(`git clone http://${user}:${password}@github.com/qbtrade/${project}.git`,(error, stdout, stderr) => {
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
function modifyPackage({config,packagePath,project}){
    return new Promise((resolve,reject)=>{
        if(typeof packagePath==='undefined'&&project){
            packagePath=`./${project}/package.json`
        }
        if(!packagePath||!config){
            reject('packagePath not set or config not set')
            return
        }
        const fs = require('fs')
        const verfile = fs.readFileSync(packagePath, 'utf8')
        let obj=JSON.parse(verfile)
        Object.assign(obj,config)
        let pretty=JSON.stringify(obj,null,2)
        fs.writeFileSync(packagePath,pretty)
        resolve()
    })
    
}
function produceHash(project){
    return new Promise((resolve,reject)=>{
        readConfig(project).then(config=>{
            const filePath=`./${project}/build/1TokenT0-Setup-${config.version}.exe`
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
function saveHash({project,sha2,sha512}){
    return new Promise((resolve,reject)=>{
        try{
            const filePath=`./${project}/build/latest.yml`
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
function readLocalConfig(){
    const filePath='./localConfig.yml'
    const fs = require('fs')
    const configContent = fs.readFileSync(filePath, 'utf8')
    yaml = require('js-yaml')
    return yaml.safeLoad(configContent)
}
function putFilesToOss({t0env,project}){
    return new Promise((resolve,reject)=>{
        let sourceFolder=`./${project}/build`
    let OSSFolder
    switch(t0env){
        case 'product':
            OSSFolder='t0-deploy/win32'
            break
        case 'test':
            OSSFolder='t0-test-deploy/win32'
            break
        case 'internal':
            OSSFolder='t0-internal-deploy/win32'
            break
        default:
            reject(`unknown enviroment ${t0env}`)
            return
    }
    let downLoadFolder='download'
    let OSS = require('ali-oss');
    
    let config=readLocalConfig()
    let client = new OSS({
        endpoint: config.endpoint,
        accessKeyId: config.accessKeyId,
        accessKeySecret: config.accessKeySecret
    })
    client.useBucket('otimg')
        readConfig(project).then(config=>{
            const fileNames=[`1TokenT0-Setup-${config.version}.exe`,`1TokenT0-Setup-${config.version}.exe.blockmap`,'releaseNotes.txt','latest.yml']
            try{
                const promises=[]
                for(let file of fileNames){
                    promises.push(client.put(`${OSSFolder}/${file}`, `${sourceFolder}/${file}`,{timeout:1800000}))
                }
                if(t0env==='product'){
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
function installProjectDeps(project){
    return new Promise((resolve,reject)=>{
        exec(`cd ./${project} && npm install`,(error, stdout, stderr) => {
            if(error){
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
function pullT0Project(project){
    return new Promise((resolve,reject)=>{
        exec(`cd ${project} && git checkout . && git pull`,(error, stdout, stderr) => {
            if (error) {
                reject(error)
            }
            else{
                resolve()
            }
            
        })
    })
}
function buildT0(project){
    return new Promise((resolve,reject)=>{
        exec(`cd ${project} && npm run build`,(error, stdout, stderr) => {
            if (error) {
                reject(error)
            }
            else{
                resolve()
            }
        })
    })
}
function readConfig(project){
    return new Promise((resolve,reject)=>{
        var fs = require("fs");
        fs.readFile(`./${project}/package.json`,  (err, data)=> {
            if (err) {
                reject(err)
            }
            else{
                resolve(JSON.parse(data.toString()))
            }
        })
    })
}
function sign(project){
    return new Promise((resolve,reject)=>{
        readConfig(project).then(config=>{
            exec(`signtool sign /tr http://timestamp.digicert.com /td sha256 /fd sha256 /a ./${project}/build/1TokenT0-Setup-${config.version}.exe"`,(error, stdout, stderr) => {
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

module.exports= {readLocalConfig,modifyPackage,putFilesToOss,saveHash,produceHash,installDeploymentDeps,cloneProject,installProjectDeps,installServerDeps,sign,readConfig,buildT0,pullT0Project}