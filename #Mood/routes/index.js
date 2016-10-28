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
        consumer_key: '8uCnElCvIFMhfuAJbglIiMa2F',
        consumer_secret: 'U96g5T8vKT02dcpS1IJdC8u0jr5mr5CtfvoMyBRCenSJsefDLX',
        access_token: '340578742-7kM8czY04wrBjDYmouTmTK74dq0sCUgVo2tt4tps',
        access_token_secret: 'UYb6i3lUQ4yHXxH9q4ujlM6HHNVAn5mz6KjIKbzJNiasI'
    });

    var stream = T.stream('statuses/filter', {language: 'en', track: "trump, clinton"});
    /* GET home page. */


    router.get('/', function (req, res, next) {

        res.render('index', {title: '#Mood'});
    });

    natural.BayesClassifier.load('classifier.json', null, function (err, classifier) {
        classifierr = classifier;
    });


    router.get("/search", function (req, res) {
        if (io.engine.clientsCount > 0 && started == false) {
            stream.start();
            started = true;
        }

        var query = req.query.q;
        natural.PorterStemmer.attach();
        console.log(query);

        var userId = randomstring.generate();
        req.on('end', function () {

        });

        res.render('search', {title: query, userId: userId});



        var trumpPos = [];
        var trumpNeG = [];
        var clintPos = [];
        var clintNeg = [];
        var totalTweets = 0;
        stream.on('tweet', function (tweet) {
            if (io.engine.clientsCount == 0) {
                stream.stop();
                started = false;

            } else {
                totalTweets += 1;
                var tweetxt = tweet.text;

                    //console.log(tweet.text);

                    var accountname = tweet.user.screen_name;
                    var tweetid = tweet.id_str;
                    stemedList = tweetxt.tokenizeAndStem();
                    var sentence = "";

                    for (var i = 0; i < stemedList.length; i++) {
                        sentence += stemedList[i] + " ";
                    }
                    var clas = classifierr.classify(sentence);
                    var trumpId = "";
                    var clintonId = "";
                // sort out positive and negative tweets for both candidates
                    if(tweetxt.includes("trump".toLowerCase()) && tweetxt.includes("clinton".toLowerCase())){
                        console.log("Both");

                        var x = Math.floor((Math.random() * 2) + 1);  // ether 1 || 2
                        if(clas == 0 && x == 1){
                            trumpNeG.push(tweetxt);
                            trumpId = tweet.id_str;
                        }else if(clas == 4 && x == 1){
                            trumpPos.push(tweetxt);
                            trumpId = tweet.id_str;

                        }else if(clas == 0 && x == 2){
                            clintNeg.push(tweetxt);
                            clintonId = tweet.id_str;
                        }else {
                            clintPos.push(tweetxt);
                            clintonId = tweet.id_str;

                        }

                    }else if (tweetxt.includes("trump".toLowerCase()) && clas == 4) {
                        trumpPos.push(tweetxt);
                        trumpId = tweet.id_str;
                        console.log("trump");

                    }else if(tweetxt.includes("trump".toLowerCase()) && clas == 0){
                        trumpNeG.push(tweetxt);
                        trumpId = tweet.id_str;
                        console.log("trump");


                    }else if (tweetxt.includes("clinton".toLowerCase()) && clas == 4) {
                        clintPos.push(tweetxt);
                        clintonId = tweet.id_str;
                        console.log("clinton");

                    }else if(tweetxt.includes("clinton".toLowerCase()) && clas == 0){
                        clintNeg.push(tweetxt);
                        clintonId = tweet.id_str;
                        console.log("clinton");

                    }

                    var positivePercentageTrump = ((trumpPos.length) / (trumpPos.length + trumpNeG.length)) * 100;
                    var positivePercentageClinton = ((clintPos.length) / (clintNeg.length + clintPos.length)) * 100;

                var emit = {
                        tweet: tweet,
                        clas: clas,
                        trumpId: trumpId,
                        clintonId: clintonId,
                        tweetId: tweetid,
                        accountName: accountname,
                        userId: userId,
                        positivePercentageTrump: positivePercentageTrump,
                        positivePercentageClinton: positivePercentageClinton

                    };
                // console.log("trumpId " + trumpId);
                // console.log("clintId " + clintonId);
                // console.log("Percentage Trump " + positivePercentageTrump);
                // console.log("Percentage Clint " + positivePercentageClinton);
                // console.log("");
                // console.log("");


                io.emit(userId, emit);
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

        stream.on("error", function (error) {
            console.log("Crash: " + error + " " + error.statusCode + "  " + error.allErrors);

        })


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
