module.exports = function (io) {
    var express = require('express');
    var router = express.Router();
    var Twit = require('twit');
    var natural = require('natural');
    var randomstring = require("randomstring");
    var MongoClient = require('mongodb').MongoClient
        , assert = require('assert');
    var url = 'mongodb://localhost:27017/Mood';
    var fs = require('fs');
    var classifierr = 0;
    var started = false;
    /*
    MongoClient.connect(url, function(err, db) {
        assert.equal(null, err);
        console.log("Connected correctly to server");


            var collection = db.collection('documents');
            // Insert some documents
            collection.insertMany([
                {a : 1}, {a : 2}, {a : 3}
            ]);

        var mydocuments = fs.readFile('classifier.json', 'utf8', function (err, data) {
            var collection = db.collection('classifier');
            collection.insertOne(JSON.parse(data), function (err, docs) { // Should succeed
                console.log('rumphull');
                console.log(err);
            });
            db.close();
        });

            // Get the documents collection
            var collection = db.collection('classifier');
            // Find some documents
            collection.find({}).toArray(function(err, docs) {
                assert.equal(err, null);
                assert.equal(1, docs.length);
                console.log("Found the following records");
                //console.dir(docs);
                console.log(docs[0]);
                natural.BayesClassifier.load(JSON.stringify(docs[0]), null, function(err, classifier) {

                    classifierr = classifier;
                });
            });


        console.log("tissefant");
    });
*/
    var T = new Twit({
        consumer_key:         '8uCnElCvIFMhfuAJbglIiMa2F',
        consumer_secret:      'U96g5T8vKT02dcpS1IJdC8u0jr5mr5CtfvoMyBRCenSJsefDLX',
        access_token:         '340578742-7kM8czY04wrBjDYmouTmTK74dq0sCUgVo2tt4tps',
        access_token_secret:  'UYb6i3lUQ4yHXxH9q4ujlM6HHNVAn5mz6KjIKbzJNiasI'
    });

    var stream = T.stream('statuses/filter', {language: 'en',track:['e']});
    /* GET home page. */


    router.get('/', function(req, res, next) {

        res.render('index', { title: '#Mood' });
    });


    router.get("/search", function (req, res) {
        if(io.engine.clientsCount > 0 && started ==false ){
            stream.start();
            started = true;
            natural.BayesClassifier.load('classifier.json', null, function(err, classifier) {
                classifierr = classifier;
            });
        }
        var query = req.query.q;
        natural.PorterStemmer.attach();
        console.log(query);

        var userId = randomstring.generate();
        req.on('end',function () {

        });
        res.render('search', { title: query, userId:userId});

        stream.on('tweet', function (tweet) {
            if(io.engine.clientsCount == 0){
                stream.stop();
                started = false;
                classifierr.save('classifier.json', function(err, classifierr) {
                    // the classifier is saved to the classifier.json file!
                });

            }else{
            console.log(tweet.text);
            var tweetxt = tweet.text;
            if(tweetxt.includes(query)){
                var accountname = tweet.user.screen_name;
                var tweetid = tweet.id_str;
                stemedList = tweetxt.tokenizeAndStem();
                var sentence = "";
                for(var i=0; i<stemedList.length;i++){
                    sentence+= stemedList[i] +" ";
                }
                var clas = classifierr.classify(sentence);
                classifierr.addDocument(sentence,clas);
                var emit = {tweet: tweet, clas: clas,tweetId: tweetid, accountName: accountname,userId:userId};
                io.emit('tweet',emit);
            }
            }
            /*

            tweet = tweet.text;
            //console.log(tweet);

                        //for(var j=0;j<stemedList.length;j++){
            //classifierr.addDocument(sentence,clas);
            //classifierr.save('classifier.json', function(err, classifierr) {
                // the classifier is saved to the classifier.json file!
            });
            var emit = {tweet: tweet, clas: clas,tweetId: tweetid, accountName: accountname};
            //}
            //console.log(clas);
            */


        });


    });

/*
     var fs = require('fs'), filename = "./positiveUse.txt";
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


    //module.exports = router;
    return router;
};
