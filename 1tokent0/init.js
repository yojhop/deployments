const {cloneProject,installProjectDeps,cloneServer,installServerDeps,installDeploymentDeps}=require('./utils')
installDeploymentDeps().then(()=>{
    console.log('install deployments dependencies done')
}).catch(err=>{
    console.log('install deployments dependencies error',err)
})
cloneProject().then(()=>{
    console.log('clone t0 project done')
    installProjectDeps().then(()=>{
        console.log('install t0 project dependencies done')
    }).catch(e=>{
        console.log('install t0 project dependencies error',e)
    })
}).catch(err=>{
    console.log('clone t0 project error',err)
})
cloneServer().then(()=>{
    console.log('clone server project done')
    installServerDeps().catch(e=>{
        console.log('install server project dependencies error',e)
    })
}).catch(err=>{
    console.log('clone server project error',err)
})
