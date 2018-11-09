const {putFilesToOss,saveHash,pullT0Project,buildT0,sign,installProjectDeps,produceHash}=require('./utils')
pullT0Project().then(()=>{
    console.log('pull t0 done')
    installProjectDeps().then(()=>{
        console.log('install t0 dependencies done')
        buildT0().then(()=>{
            console.log('build t0 done')
            sign().then(()=>{
                console.log('sign t0 exe done')
                produceHash().then(res=>{
                    let [sha2,sha512]=res
                    saveHash(sha2,sha512).then(()=>{
                        console.log('hash saved')
                        putFilesToOss(process.argv[2]).then(()=>{
                            console.log('files put to oss, deployment succeed')
                        }).catch(err=>{
                            console.log('put files to oss error',err)
                        })
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
    console.log('pull t0 error',err)
})
