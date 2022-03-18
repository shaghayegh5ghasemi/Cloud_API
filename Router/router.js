const express = require('express');
const router = express.Router();
var MongoClient = require('mongodb').MongoClient;
var dburl = "mongodb://localhost:27017/";
const url = require('url');
const fs = require('fs');
const SpeechToTextV1 = require('ibm-watson/speech-to-text/v1');
const { IamAuthenticator } = require('ibm-watson/auth');
const speechToText = new SpeechToTextV1({
  authenticator: new IamAuthenticator({
    apikey: '4SstGldKuqQiUpmZh7uhDXNDpjp6FNXs9_-3G7wYQDo4',
  }),
  serviceUrl: 'https://api.eu-gb.speech-to-text.watson.cloud.ibm.com/instances/dcf0706c-7d6b-428b-8a85-45da3119dc32',

});

const NaturalLanguageUnderstandingV1 = require('ibm-watson/natural-language-understanding/v1');
const { text, query } = require('express');

const naturalLanguageUnderstanding = new NaturalLanguageUnderstandingV1({
  version: '2021-08-01',
  authenticator: new IamAuthenticator({
    apikey: '7eODfhfwdwBCMBE-bMzHcnWrtSFta-7ssbCibQLsHheN',
  }),
  serviceUrl: 'https://api.eu-gb.natural-language-understanding.watson.cloud.ibm.com/instances/84ad8cec-eb28-470b-8c0c-40131e871486',
});

const LanguageTranslatorV3 = require('ibm-watson/language-translator/v3');

const languageTranslator = new LanguageTranslatorV3({
  version: '2018-05-01',
  authenticator: new IamAuthenticator({
    apikey: 'MKM_tWhHq8UbDjjgwhVYQns5aIVwiK4ocBCVe2tLTOKU',
  }),
  serviceUrl: 'https://api.eu-gb.language-translator.watson.cloud.ibm.com/instances/c04263bb-bd40-485f-834b-8394589b5303',
});

router.get("/", function(req, res){
    MongoClient.connect(dburl, async function (err, db) {
        var dbo = db.db("shaghadb");
        cl = await dbo.collection("movies").find().toArray()
        res.render("index.ejs", {"movies": cl})
        res.end()
      })
})

router.get("/add", function(req, res){
    var query = url.parse(req.url, true).query;
    res.render("add_comment.ejs", {"name": query.moviename})
    res.end()
})

router.post("/add", function(req, res){
    const recognizeParams = {
        audio: req.files.audio.data,
        contentType: 'audio/flac',
        wordAlternativesThreshold: 0.9
      };
      speechToText.recognize(recognizeParams)
      .then(result => {
        mytext = result.result.results[0].alternatives[0].transcript
        const analyzeParams = {
            'text': mytext,
            'features': {
              'emotion': {
                  "document": true
              }
            }
          };
          naturalLanguageUnderstanding.analyze(analyzeParams)
          .then(analysisResults => {
            anger = analysisResults.result.emotion.document.emotion.anger
            if( anger < 0.6){
                MongoClient.connect(dburl, async function (err, db) {
                    var dbo = db.db("shaghadb");
                    dbo.collection("comments").insertOne({"username": req.body.username, "body": mytext, "moviename": req.body.moviename})
                    res.redirect("/")
                  })
            }
          })
          .catch(err => {
            console.log('error:', err);
          });
      })
      .catch(err => {
        console.log('error:', err);
      });
})

router.get("/comments", function(req, res){
    MongoClient.connect(dburl, async function (err, db) {
        var dbo = db.db("shaghadb");
        var query = url.parse(req.url, true).query;
        com = await dbo.collection("comments").find({"moviename": query.moviename}).toArray()
        if(query.lang == "fr"){
            fr_list = []
            for(let i = 0; i < com.length ; i++){
                var translateParams = {
                    text: com[i].body,
                    modelId: 'en-fr',
                    };
                result = await languageTranslator.translate(translateParams)
                fr_list.push({"body":result.result.translations[0].translation, "username": com[i].username, "moviename": com[i].username})
            }
            res.render("comments.ejs", {"comments": fr_list})
        }
        else{
            if(query.lang == "it"){
                it_list = []
                for(let i = 0; i < com.length ; i++){
                    var translateParams = {
                        text: com[i].body,
                        modelId: 'en-it',
                        };
                    result = await languageTranslator.translate(translateParams)
                    it_list.push({"body":result.result.translations[0].translation, "username": com[i].username, "moviename": com[i].username})
                }
                res.render("comments.ejs", {"comments": it_list})
            }
            else{
                res.render("comments.ejs", {"comments": com})
            }
        }    
        res.end()
      })
})


module.exports = router;