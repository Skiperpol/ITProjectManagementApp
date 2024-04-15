const developerRoutes = require('./src/routes/developer');
const projectRoutes = require('./src/routes/project');
const taskRoutes = require('./src/routes/task');
const Auth = require('./src/routes/auth')
const environments = require('./src/configs/environments');
const express = require("express");
const server = express();

server.listen(environments.PORT, ()=> {
    console.log(`Node API app is running on port ${environments.PORT}`)
    require('./src/configs/database')
})

server.use(express.json())
server.use('/', Auth)
server.use('/', developerRoutes)
server.use('/', projectRoutes)
server.use('/', taskRoutes)

module.exports = server;
