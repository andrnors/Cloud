var express = require('express');
var router = express.Router();
var sw = require('stopword');
var Twit = require('twit');
var natural = require('natural');
var stop = require("keyword-extractor");


var T = new Twit({
  consumer_key:         '8uCnElCvIFMhfuAJbglIiMa2F',
  consumer_secret:      'U96g5T8vKT02dcpS1IJdC8u0jr5mr5CtfvoMyBRCenSJsefDLX',
  access_token:         '340578742-7kM8czY04wrBjDYmouTmTK74dq0sCUgVo2tt4tps',
  access_token_secret:  'UYb6i3lUQ4yHXxH9q4ujlM6HHNVAn5mz6KjIKbzJNiasI'
});


/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get("/search", function (req, res) {
    var query = req.query.q;
    natural.PorterStemmer.attach();
    console.log(query);
    var stream = T.stream('statuses/filter', {track: [query]});

    stream.on('tweet', function (tweet) {
        console.log(tweet.text);
        tweet = tweet.text;
        stemedList = tweet.tokenizeAndStem();

    });
});


var fs = require('fs'), filename = "./trainingset.txt",filename2="./sentimentdata.txt";
classifier = new natural.BayesClassifier();

fs.readFile(filename, 'utf8', function(err, data) {
    if (err) throw err;
    console.log('OK: ' + filename);

    line = data.split("\n");
    list = [];
    for(var i=0; i<line.length; i++){
        // console.log(line[i]);
        sentiment = line[i][2];
        tweetText = line[i].substring(7, line[i].length - 4);
        list.push([sentiment, tweetText]);
    }
    //var tokentweet = [];

    for(var j =0; j < list.length; j++){
        natural.PorterStemmer.attach();
        var tokentweet = list[j][1];
        tokentweet = tokentweet.tokenizeAndStem();
        var finalTweetString = "";
        for(var x=0; x<tokentweet.length; x++ ){
            finalTweetString += tokentweet[x] + " ";
        }
        //console.log(finalTweetString + "  " + list[j][0]);
        classifier.addDocument(finalTweetString,list[j][0]);
    }
    classifier.train();
    var check = 'icecream';
    console.log(classifier.classify(check));
    console.log(classifier.getClassifications(check));
    //var check = 'I hate my moms homecooking';
    //console.log(classifier.classify(check));
    //console.log(classifier.getClassifications(check));

});
fs.readFile(filename2, 'utf8', function(err, data) {
    if (err) throw err;
    console.log('OK: ' + "safasdfaf");

    line = data.split("\n");
    list = [];
    for(var i=0; i<line.length; i++){
        // console.log(line[i]);
        sentiment = line[i][2];
        tweetText = line[i].substring(7, line[i].length - 4);
        list.push([sentiment, tweetText]);
    }
    //var tokentweet = [];

    for(var j =0; j < list.length; j++){
        natural.PorterStemmer.attach();
        var tokentweet = list[j][1];
        tokentweet = tokentweet.tokenizeAndStem();
        var finalTweetString = "";
        for(var x=0; x<tokentweet.length; x++ ){
            finalTweetString += tokentweet[x] + " ";
        }
        //console.log(finalTweetString + "  " + list[j][0]);
        classifier.addDocument(finalTweetString,list[j][0]);
    }
    classifier.train();


});


module.exports = router;
