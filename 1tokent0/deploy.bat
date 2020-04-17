%node ./deployment.js ${projectName} ${version} ${env(product|test|internal)} ${branch(master if empty)}%
node ./deployment.js 1token-t0 2.3.0-test-14 test