%node ./deployment.js ${projectName} ${version} ${env(product|test|internal)} ${branch(master if empty)}%
node ./deployment.js 1token-t0 2.2.0 product v2.2.0