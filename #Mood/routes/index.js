module.exports = function (io) {
    var express = require('express');
    var router = express.Router();
    var Twit = require('twit');
    var natural = require('natural');
    var randomstring = require("randomstring");
    var fs = require('fs');
    var classifierr = 0;
    var started = false;
    var $ = require("jquery");
    var pm2 = require("pm2");

    var trumpPos = 0;
    var trumpTotal = 0;
    var clintPos = 0;
    var clintTotal = 0;
    var totalTweets = 0;
    var otherTweets = 0;
    var otherTweetsTotal = 0;
    var EveryDayTrump = 0;
    var EveryDayClint = 0;
    var EveryDayTotal = 0;
    var trumpNeg = 0;
    var clintNeg = 0;
    var EveryDayTumpNeg = 0;
    var EveryDayClintNeg = 0;
    var EveryDayTotalClint = 0;
    var EveryDayTotalTrump = 0;
    var accountName = "";

    var MongoClient = require('mongodb').MongoClient
        , assert = require('assert');
    var url = 'mongodb://localhost:27017/Mood';

    MongoClient.connect(url, function (err, db) {
        assert.equal(null, err);
        console.log("Connected correctly to server");
        var collection = db.collection('prediction');
        // Insert some documents

        var today = new Date();
        var dd = today.getDate();
        var mm = today.getMonth() + 1;
        var yyyy = today.getFullYear();
        today = dd + '/' + mm + '/' + yyyy;
        today = today.toString();

        collection.find({}).toArray(function (err, docs) {
            assert.equal(err, null);
            // console.log("Found the following records");
            // console.log(docs);
        });

        var T = new Twit({
            consumer_key: '8uCnElCvIFMhfuAJbglIiMa2F',
            consumer_secret: 'U96g5T8vKT02dcpS1IJdC8u0jr5mr5CtfvoMyBRCenSJsefDLX',
            access_token: '340578742-7kM8czY04wrBjDYmouTmTK74dq0sCUgVo2tt4tps',
            access_token_secret: 'UYb6i3lUQ4yHXxH9q4ujlM6HHNVAn5mz6KjIKbzJNiasI'
        });

        var stream = T.stream('statuses/filter', {language: 'en', track: ["clinton", "trump"]});
        var users = [];

        /* GET home page. */
        // router.get('/', function (req, res, next) {
        //     res.render('index', {title: '#Mood'});
        // });

        natural.BayesClassifier.load('classifier.json', null, function (err, classifier) {
            classifierr = classifier;
        });

        router.get("/", function (req, res) {

            if (io.engine.clientsCount >= 0 && started == false) {
                console.log("started first time: " + started);

                // Update total variables
                collection.find({}).toArray(function (err, docs) {
                    if(err){
                        console.log(err);
                    }
                    assert.equal(err, null);

                    console.log("Found the following records");
                    console.log(docs);

                    EveryDayTotal = 0;
                    EveryDayTrump = 0;
                    EveryDayClint = 0;
                    EveryDayTotalTrump = 0;
                    EveryDayTotalClint = 0;
                    docs.forEach(function (day, index) {
                        console.log("Updateed " + day.TotalDay);
                        console.log("EveryDayTotal " + EveryDayTotal);

                        EveryDayTotal += day.TotalDay;
                        EveryDayTrump += day.TrumpPosDay;
                        EveryDayClint += day.ClintPosDay;
                        EveryDayTotalTrump += day.TotalTrumpDay;
                        EveryDayTotalClint += day.TotalClintDay;
                    });
                    console.log("EveryDayTotal " + EveryDayTotal);


                });

                // Find today's data
                collection.find({"Date": today}).toArray(function (err, docs) {
                    assert.equal(err, null);
                    console.log("Docs today " + docs);
                    if (docs == null || isEmpty(docs)) {
                        collection.insertOne({
                            "Date": today,
                            "TotalDay": totalTweets,
                            "ClintPosDay": clintPos,
                            "TrumpPosDay": trumpPos,
                            "TotalClintDay": clintTotal,
                            "TotalTrumpDay": trumpTotal
                        });
                        stream.start();
                        started = true;
                    }
                    else {
                        totalTweets = docs[0].TotalDay;
                        clintPos = docs[0].ClintPosDay;
                        trumpPos = docs[0].TrumpPosDay;
                        trumpTotal = docs[0].TotalTrumpDay;
                        clintTotal = docs[0].TotalClintDay;
                        stream.start();
                        started = true;
                    }
                });

            }

            natural.PorterStemmer.attach();
            var userId = randomstring.generate();
            users.push(userId);
            res.render('search', {title: "HELLO", userId: userId});

            stream.on('tweet', function (tweet) {
                if (io.engine.clientsCount == 0 && started) {
                    console.log('in here on stoped');
                    started = false;
                    // stream.stop();

                    collection.find({"Date": today}).toArray(function (err, docs) {
                        assert.equal(err, null);
                        console.log("Found the following records");
                        console.log(docs);
                        collection.update({"Date": today}, {
                            "Date": today,
                            "TotalDay": totalTweets,
                            "ClintPosDay": clintPos,
                            "TrumpPosDay": trumpPos,
                            "TotalClintDay": clintTotal,
                            "TotalTrumpDay": trumpTotal
                        },
                            {upsert: true});

                    });

                } else {
                    totalTweets += 1;
                    EveryDayTotal += 1;
                    var tweetxt = tweet.text.toLocaleLowerCase();
                    var tweetid = tweet.id_str;
                    accountName = tweet.screen_name;
                    var stemedList = tweetxt.tokenizeAndStem();
                    var sentence = "";

                    for (var i = 0; i < stemedList.length; i++) {
                        sentence += stemedList[i] + " ";
                    }
                    var clas = classifierr.classify(sentence);
                    var trumpId = "";
                    var clintonId = "";

                    // sort out positive and negative tweets for both candidates
                    if (tweetxt.includes("trump") && tweetxt.includes("clinton")) {
                        //console.log("Both");
                        var x = Math.floor((Math.random() * 2) + 1);  // ether 1 || 2
                        if (x == 2) {
                            EveryDayTotalClint += 1;
                            clintTotal += 1;
                            clintonId = tweetid;
                            if (clas == 4) {
                                clintPos += 1;
                                EveryDayClint += 1;
                            }
                        } else {
                            EveryDayTotalTrump += 1;
                            trumpTotal += 1;
                            trumpId = tweetid;
                            if (clas == 4) {
                                trumpPos += 1;
                                EveryDayTrump += 1;
                            }
                        }
                    }
                    else if (tweetxt.includes("trump")) {
                        EveryDayTotalTrump += 1;
                        trumpTotal += 1;
                        trumpId = tweetid;
                        if (clas = 4) {
                            trumpPos += 1;
                            EveryDayTrump += 1;
                        }
                    } else {
                        EveryDayTotalClint += 1;
                        clintTotal += 1;
                        if (clas == 4) {
                            clintonId = tweetid;
                            clintPos += 1;
                            EveryDayClint += 1;
                        }
                    }

                    otherTweets = totalTweets - trumpPos - clintPos;
                    otherTweetsTotal = EveryDayTotal - EveryDayClint - EveryDayTrump;
                    clintNeg = clintTotal - clintPos;
                    trumpNeg = trumpTotal - trumpPos;
                    EveryDayClintNeg = EveryDayTotalClint - EveryDayClint;
                    EveryDayTumpNeg = EveryDayTotalTrump - EveryDayTrump;

                    var emit = {
                        retweeted: tweet.retweeted,
                        accountName: accountName,
                        tweet: tweet.text,
                        tweetsTotalTrump: trumpTotal,
                        tweetsTotalClinton: clintTotal,
                        totalTweets: totalTweets,
                        clas: clas,
                        trumpId: trumpId,
                        clintonId: clintonId,
                        tweetId: tweetid,
                        userId: userId,
                        trumpTweetNumber: trumpPos,
                        clintonTweetNumber: clintPos,
                        otherTweets: otherTweets,
                        EveryDayTrump: EveryDayTrump,
                        EveryDayClint: EveryDayClint,
                        EveryDayTotal: EveryDayTotal,
                        otherTweetsTotal: otherTweetsTotal,
                        clintNeg: clintNeg,
                        trumpNeg: trumpNeg,
                        EveryDayClintNeg: EveryDayClintNeg,
                        EveryDayTrumpNeg: EveryDayTumpNeg
                    };
                    io.emit(userId, emit);
                }

            });
            stream.on("error", function (error) {
                console.log(error);
                if (error == "Error: unexpected end of file") {
                    // Random error, stops the stream, saves all data and restart
                    // stream.stop();
                    collection.find({"Date": today}).toArray(function (err, docs) {
                        assert.equal(err, null);
                        console.log("Found the following records");
                        console.log(docs);
                        collection.update({"Date": today}, {
                                "Date": today,
                                "TotalDay": totalTweets,
                                "ClintPosDay": clintPos,
                                "TrumpPosDay": trumpPos,
                                "TotalClintDay": clintTotal,
                                "TotalTrumpDay": trumpTotal
                            },
                            {upsert: true});

                    });
                    pm2.restart('bin/www', function () {
                        console.log("Restarted");
                    });
                }
            });
        });
    });
    function isEmpty(obj) {
        for (var prop in obj) {
            if (obj.hasOwnProperty(prop)) {
                return false;
            }
        }
        return true;
    }

    // var fs = require('fs'), filename = "./positiveUse.txt";
    // classifier = new natural.BayesClassifier();
    //
    // fs.readFile(filename, 'utf8', function(err, data) {
    // if (err) throw err;
    // console.log('OK: ' + filename);
    //
    // line = data.split("\n");
    // list = [];
    // for(var i=0; i<line.length; i++){
    // sentiment = line[i][2];
    // tweetText = line[i].substring(7, line[i].length - 4);
    // list.push([sentiment, tweetText]);
    // }
    //
    // for(var j =0; j < list.length; j++){
    // natural.PorterStemmer.attach();
    // var tokentweet = list[j][1];
    // tokentweet = tokentweet.tokenizeAndStem();
    // var finalTweetString = "";
    // for(var x=0; x<tokentweet.length; x++ ){
    // finalTweetString += tokentweet[x] + " ";
    // }
    // classifier.addDocument(finalTweetString,list[j][0]);
    // }
    // classifier.train();
    // classifier.save('classifier.json', function(err, classifier) {
    // // the classifier is saved to the classifier.json file!
    // });
    // var check = 'I like icecream';
    // console.log(check);
    // console.log(classifier.classify(check));
    // console.log(classifier.getClassifications(check));
    // });


    //module.exports = router;
    return router;
};
