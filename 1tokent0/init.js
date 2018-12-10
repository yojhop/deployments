const {cloneProject,installProjectDeps,cloneServer,installServerDeps,installDeploymentDeps,readLocalConfig}=require('./utils')
function startInit(){
    if(process.argv.length<3){
        console.log(`argv length shold at least be 3(node ./init.js 1token-t0)`)
        return
    }
    
    let config=readLocalConfig()
    config.project=process.argv[2]
    installDeploymentDeps().then(()=>{
        console.log('install deployments dependencies done')
    }).catch(err=>{
        console.log('install deployments dependencies error',err)
    })
    cloneProject(config).then(()=>{
        console.log('clone t0 project done')
        installProjectDeps(config.project).then(()=>{
            console.log('install t0 project dependencies done')
        }).catch(e=>{
            console.log('install t0 project dependencies error',e)
        })
    }).catch(err=>{
        console.log('clone t0 project error',err)
    })
}

startInit()