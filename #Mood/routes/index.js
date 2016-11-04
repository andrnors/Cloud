module.exports = function (io) {
    var express = require('express');
    var router = express.Router();
    var Twit = require('twit');
    var natural = require('natural');
    var randomstring = require("randomstring");
    var fs = require('fs');
    var classifierr = 0;         //the classifier used for the sentiment analysis
    var started = false;        //indicates if the stream has started or not
    var AWS = require('aws-sdk');
    AWS.config.update({region: "us-west-2", endpoint: "https://dynamodb.us-west-2.amazonaws.com"});
    var docClient = new AWS.DynamoDB.DocumentClient();
    var $ = require("jquery");
    var dynamodb = new AWS.DynamoDB();
    var pm2 = require("pm2");
    var sqs = new AWS.SQS();
    var queueUrl = "https://sqs.us-west-2.amazonaws.com/895470307141/TweetQueue";
    var Load = 11;              //The initial load, indicates how many milliseconds we wait between requesting from the queue
    var intervalStarted = true; //Indicates wether the interval requesting tweets has started or stopped
    var interval = "";

    //Set of variables needed for calculating the the total number of tweets for the
    //respective candidates and their sentiments
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


    natural.BayesClassifier.load('classifier.json', null, function (err, classifier) {
        classifierr = classifier;       //here we load in the classifier which is created from a json file on the server
    });

    router.get("/", function (req, res) {
        var queueParams = {       //parameters for the queue, basically containing the request url of the sqs queue
            QueueUrl: queueUrl
        };
        func = function () { //the function that is ran with every interval
            if (io.engine.clientsCount > 0 && started == false) { //if we have users connected and the stream has not started
                started = true;
                var today = new Date();
                var dd = today.getDate();
                var mm = today.getMonth() + 1;
                var yyyy = today.getFullYear();
                today = dd + '/' + mm + '/' + yyyy;
                today = today.toString();     //creates a variable for the current day, used for querying the database for tables corresponding to this day
                var totalParams = {           //our database table and what we wish to retrieve from it
                    TableName: "PredictionNumbers",
                    ProjectionExpression: "TrumpPosDay, ClintPosDay,TotalDay,TotalClintDay,TotalTrumpDay"
                };

                docClient.scan(totalParams, onScan);  //scans the database for tables, gets all of them
                function onScan(err, data) {
                    if (err) {
                        console.error("Unable to scan the table. Error JSON:", JSON.stringify(err, null, 2));
                    } else {
                        EveryDayTotal = 0;                    //initialize these as 0 again because if not they'll just keep increasing with every scan
                        EveryDayTrump = 0;
                        EveryDayClint = 0;
                        EveryDayTotalTrump = 0;
                        EveryDayTotalClint = 0;
                        data.Items.forEach(function (day) {    //add the variables from every day found to the EveryDay variables
                            EveryDayTotal += day.TotalDay;
                            EveryDayTrump += day.TrumpPosDay;
                            EveryDayClint += day.ClintPosDay;
                            EveryDayTotalTrump += day.TotalTrumpDay;
                            EveryDayTotalClint += day.TotalClintDay;
                        });

                        if (typeof data.LastEvaluatedKey != "undefined") {    //there are more elements to get
                            console.log("Scanning for more...");
                            totalParams.ExclusiveStartKey = data.LastEvaluatedKey;
                            docClient.scan(totalParams, onScan);
                        }
                    }
                }

                //get today's numbers
                var dailyParams = {
                    TableName: 'PredictionNumbers',
                    Key: {
                        "Date": today             //get the table with the todat's date as date
                    }
                };
                docClient.get(dailyParams, function (err, data) {
                    if (err) {
                        console.error("Unable to read item. Error JSON:", JSON.stringify(err, null, 2));
                    } else {
                        if (isEmpty(data)) {        //we got some data, but it could be just a empty JSON object, if it is it means that there is no database table with these
                            var params = {        //spesifications so we create one.
                                TableName: "PredictionNumbers",
                                Item: {
                                    "Date": today,
                                    "TotalDay": totalTweets,  //these will be 0 upon creations
                                    "ClintPosDay": clintPos,
                                    "TrumpPosDay": trumpPos,
                                    "TotalClintDay": clintTotal,
                                    "TotalTrumpDay": trumpTotal
                                }
                            };
                            docClient.put(params, function (err, data) {       //adds the new table
                                if (err) {
                                    console.error("Unable to add predictions", ". Error JSON:", JSON.stringify(err, null, 2));
                                }
                            });
                        } else {                                        //JSON object is not empty so we actually go a table, we proceed to initialize the respective variables with these values.
                            totalTweets = data.Item.TotalDay;
                            clintPos = data.Item.ClintPosDay;
                            trumpPos = data.Item.TrumpPosDay;
                            trumpTotal = data.Item.TotalTrumpDay;
                            clintTotal = data.Item.TotalClintDay;
                        }
                    }
                });
            }
            else if (io.engine.clientsCount == 0 && started) {        //if we have no connected users, but the stream has started.
                started = false;                                      //stop the stream
                var today = new Date();
                var dd = today.getDate();
                var mm = today.getMonth() + 1;
                var yyyy = today.getFullYear();
                today = dd + '/' + mm + '/' + yyyy;
                today = today.toString();                             //set todays date
                var params = {
                    TableName: 'PredictionNumbers',                    //after we stop the stream we take the current data and update the table for that day
                    Key: {
                        "Date": today
                    },
                    UpdateExpression: "set ClintPosDay = :c, TrumpPosDay= :t, TotalDay=:d,TotalTrumpDay= :ttd, TotalClintDay=:tcd ",
                    ExpressionAttributeValues: {
                        ":d": totalTweets,
                        ":c": clintPos,
                        ":t": trumpPos,
                        ":ttd": trumpTotal,
                        ":tcd": clintTotal
                    },
                    ReturnValues: "UPDATED_NEW"
                };

                docClient.update(params, function (err, data) {
                    if (err) {
                        console.error("Unable to update item. Error JSON:", JSON.stringify(err, null, 2));
                    }
                });

            }
            sqs.receiveMessage(queueParams, function (err, data) {     //here we ask the aws sqs queue to recieve a message
                if (err) {
                    console.log(err);
                }
                else if (started && intervalStarted && !isEmpty(data.Messages)) {  //only run if the stream has started, the request interval and we actually got a response with a message from the queue.
                    var tweet = JSON.parse(data.Messages[0].Body);                //parse the body of the message, containing the tweet variables
                    totalTweets += 1;                                             //increase the tweet counters
                    EveryDayTotal += 1;
                    var tweetxt = tweet.tweetText.toLocaleLowerCase();        //javascript's .includes method is case sensitive, better to just make everything lowercase
                    var tweetid = tweet.tweetId;                              //different variables for displaying the tweet
                    var accountName = tweet.accountName;
                    var stemedList = tweetxt.tokenizeAndStem();              //tokenize and stem the tweet text, creates a list
                    var sentence = "";

                    for (var i = 0; i < stemedList.length; i++) {             //makes a sentence out of the stemmed and tokenized list.
                        sentence += stemedList[i] + " ";
                    }
                    var clas = classifierr.classify(sentence);                //use the classifier to classify the
                    var trumpId = "";
                    var clintonId = "";

                    // sort out positive and negative tweets for both candidates
                    if (tweetxt.includes("trump") && tweetxt.includes("clinton")) {   //if the tweet contains both trump and clinton
                        //console.log("Both");
                        var x = Math.floor((Math.random() * 2) + 1);  // ether 1 || 2 - attribute the tweet randomly to either trump or clinton
                        if (x == 2) {                                 //update variables for the respective candidates
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
                    else if (tweetxt.includes("trump")) {         //contains just trump
                        EveryDayTotalTrump += 1;
                        trumpTotal += 1;
                        trumpId = tweetid;
                        if (clas = 4) {
                            trumpPos += 1;
                            EveryDayTrump += 1;
                        }
                    } else {                                      //contains clinton
                        EveryDayTotalClint += 1;
                        clintTotal += 1;
                        if (clas == 4) {
                            clintonId = tweetid;
                            clintPos += 1;
                            EveryDayClint += 1;
                        }
                    }

                    otherTweets = totalTweets - trumpPos - clintPos;                      //calculates the different variables used in the browser on the client page
                    otherTweetsTotal = EveryDayTotal - EveryDayClint - EveryDayTrump;
                    clintNeg = clintTotal - clintPos;
                    trumpNeg = trumpTotal - trumpPos;
                    EveryDayClintNeg = EveryDayTotalClint - EveryDayClint;
                    EveryDayTumpNeg = EveryDayTotalTrump - EveryDayTrump;

                    //the variables to emit
                    var emit = {
                        accountName: accountName,
                        tweet: tweetxt,
                        tweetsTotalTrump: trumpTotal,
                        tweetsTotalClinton: clintTotal,
                        totalTweets: totalTweets,
                        clas: clas,
                        trumpId: trumpId,
                        clintonId: clintonId,
                        tweetId: tweetid,
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

                    io.emit("tweet", emit);   //emits the emit object to the tweet function

                    var recietParams = {      //the params to send in as reciet indicating to the queue that we recieved the message
                        QueueUrl: queueUrl,
                        ReceiptHandle: data.Messages[0].ReceiptHandle
                    };

                    sqs.deleteMessage(recietParams, function (err, data) {        //we recieved the message so now we delete it from the queue.
                        if (err) {
                            console.log(err);
                        }

                    });
                }

            });

        };

        interval = setInterval(func, Load);        //starts the initial interval upon startup

        natural.PorterStemmer.attach();           //attatch the stemmer to natural

        res.render('search', {title: "Election Predictor"});

    });


    router.post('/LoadChange', function (req, res) {     //post method that when comming from the client changes the load value
        Load = req.body.LoadValue;                     //Load is the value sent from the slide bar on the client side.
        if (Load == 0) {                                 //If load is 0 we stop requesting tweets
            intervalStarted = false;
            Load = number.POSITIVE_INFINITY;                       //just set the load to a really high number
        } else {
            intervalStarted = true;                     //load is not null so interval is started.
            Load = 11497.57 * (Math.pow(0.8697, Load));    //function that converts the slidebar value which is between 0 and 100 to a load value between 10 and 10000, corresponding to the amount of milliseconds between tweet requests
                                                           //thank you to Ørjan Bostad Vesterlid for this function.
        }
        clearInterval(interval);                        //clear the current interval
        interval = setInterval(func, Load);              //create a new interval with the new load value
        res.send('ok');

    });


    function isEmpty(obj) {      //this method checks if a object is empty or not, return true if it is.
        for (var prop in obj) {
            if (obj.hasOwnProperty(prop)) {
                return false;
            }
        }
        return true;
    }

    return router;
};
