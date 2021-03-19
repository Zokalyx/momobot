const express = require('express');
const server = express();
server.all('/', (req, res)=>{
    res.send('Hi uwu')
})
function keepAlive(){
    console.log("Opening server...")
    server.listen(3000, ()=>{console.log("Server online!")});
}
module.exports = keepAlive;