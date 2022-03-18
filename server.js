const express = require('express');
const app = express();
const router = require('./Router/router.js');  
const bodyParser = require('body-parser');   //for parsing and getting data from http post request
const fileUpload = require('express-fileupload');
var http = require('http');


app.use(express.static('public'));    // files on the public path are downloadable
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.use(fileUpload({useTempFiles : false}))

app.set('views','./htmls');
app.engine('html', require('ejs').renderFile);
app.use('/',router);

var httpServer = http.createServer(app);

httpServer.listen(8000);
console.log("http started")