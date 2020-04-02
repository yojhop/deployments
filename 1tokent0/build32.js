const {modifyPackage,putFilesToOss,saveHash,pullT0Project,buildT032,sign,installProjectDeps,produceHash,readLocalConfig}=require('./utils')

function startBuild(){
    if(process.argv.length<5){
        console.log('ERROR: at least 5 argvs(node ./deployment project version env [branch])')
        return
    }
    let [,,project,version,t0env,branch]=process.argv
    if(typeof branch ==='undefined') branch='master'
    let config=readLocalConfig()
    pullT0Project(project,branch,config.user,config.password).then(()=>{
        console.log('pull t0 done')
        let config={t0env,version}
        modifyPackage({config,project}).then(res=>{
            console.log('modify package done')
            installProjectDeps(project).then(()=>{
                console.log('install t0 dependencies done')
                buildT032(project).then(()=>{
                    console.log('build t0 done')
                    sign(project).then(()=>{
                        console.log('sign t0 exe done')
                        produceHash(project).then(res=>{
                            let [sha2,sha512]=res
                            saveHash({project,sha2,sha512}).then(()=>{
                                console.log('hash saved')
                                // putFilesToOss({t0env,project}).then(()=>{
                                //     console.log('files put to oss, deployment succeed')
                                // }).catch(err=>{
                                //     console.log('put files to oss error',err)
                                // })
                            }).catch(err=>{
                                console.log('save has error',err)
                            })
                        }).catch(err=>{
                            console.log('produceHash error',err)
                        })
                    }).catch(err=>{
                        console.log('sign t0 exe error',err)
                    })
                }).catch(err=>{
                    console.log('build t0 error',err)
                })
            }).catch(err=>{
                console.log('install t0 dependencies error',err)
            })
        }).catch(err=>{
            console.log('modify package error',err)
        })
        
        
        
    }).catch(err=>{
        console.log('pull t0 error',err)
    })
}
startBuild()