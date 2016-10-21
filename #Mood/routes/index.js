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
var classifierr = 0;
natural.BayesClassifier.load('classifier.json', null, function(err, classifier) {

    classifierr = classifier;
});

router.get("/search", function (req, res) {
    var query = req.query.q;
    natural.PorterStemmer.attach();
    console.log(query);
    var stream = T.stream('statuses/filter', {track: [query]});
    console.log(classifierr.classify("icecream"));

/*
    stream.on('tweet', function (tweet) {
        //console.log(tweet.text);
        tweet = tweet.text;
        stemedList = tweet.tokenizeAndStem();
        var sentence = "";
        for(var i=0; i<stemedList.length;i++){
            sentence+= stemedList[i] +" ";
        }

        var clas = classifierr.classify(sentence);
        //for(var j=0;j<stemedList.length;j++){
            classifierr.addDocument(sentence,clas);

        //}
        console.log(clas);
        classifierr.save('classifier.json', function(err, classifierr) {
            // the classifier is saved to the classifier.json file!
        });

    });*/
});

/*
var fs = require('fs'), filename = "./tweetSet.txt";
classifier = new natural.BayesClassifier();

fs.readFile(filename, 'utf8', function(err, data) {
    if (err) throw err;
    console.log('OK: ' + filename);

    line = data.split("\n");
    list = [];
    for(var i=0; i<line.length; i++){
        sentiment = line[i][2];
        tweetText = line[i].substring(7, line[i].length - 4);
        list.push([sentiment, tweetText]);
    }

    for(var j =0; j < list.length; j++){
        natural.PorterStemmer.attach();
        var tokentweet = list[j][1];
        tokentweet = tokentweet.tokenizeAndStem();
        var finalTweetString = "";
        for(var x=0; x<tokentweet.length; x++ ){
            finalTweetString += tokentweet[x] + " ";
        }
        classifier.addDocument(finalTweetString,list[j][0]);
    }
    classifier.train();
    classifier.save('classifier.json', function(err, classifier) {
        // the classifier is saved to the classifier.json file!
    });
    var check = 'I like icecream';
    console.log(check);
    console.log(classifier.classify(check));
    console.log(classifier.getClassifications(check));
});*/

module.exports = router;
