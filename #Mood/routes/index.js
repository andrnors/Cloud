module.exports = function (io) {
    var express = require('express');
    var router = express.Router();
    var Twit = require('twit');
    var natural = require('natural');
    var randomstring = require("randomstring");
    var fs = require('fs');
    var classifierr = 0;
    var started = false;
    var AWS = require('aws-sdk');
    AWS.config.update({ region: "us-west-2", endpoint: "https://dynamodb.us-west-2.amazonaws.com" });
    var docClient = new AWS.DynamoDB.DocumentClient();
    var $ = require("jquery");
    var dynamodb = new AWS.DynamoDB();
    var pm2 = require("pm2");

    var trumpPos = 0;
    var trumpTotal  = 0;
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
              var today = new Date();
              var dd = today.getDate();
              var mm = today.getMonth()+1;
              var yyyy = today.getFullYear();
              today = dd+'/'+mm+'/'+yyyy;
              today = today.toString();
              var totalParams = {
                  TableName: "PredictionNumbers",
                  ProjectionExpression: "TrumpPosDay, ClintPosDay, TotalDay,TotalClintDay,TotalTrumpDay"
              };

              docClient.scan(totalParams, onScan);
              function onScan(err, data) {
                  if (err) {
                      console.error("Unable to scan the table. Error JSON:", JSON.stringify(err, null, 2));
                  } else {
                      EveryDayTotal = 0;
                      EveryDayTrump = 0;
                      EveryDayClint = 0;
                      EveryDayTotalTrump = 0;
                      EveryDayTotalClint = 0;
                      console.log("Scan succeeded.");
                      data.Items.forEach(function(day) {
                          EveryDayTotal += day.TotalDay;
                          EveryDayTrump += day.TrumpPosDay;
                          EveryDayClint += day.ClintPosDay;
                          EveryDayTotalTrump += day.TotalTrumpDay;
                          EveryDayTotalClint += day.TotalClintDay;
                      });

                      if (typeof data.LastEvaluatedKey != "undefined") {
                          console.log("Scanning for more...");
                          totalParams.ExclusiveStartKey = data.LastEvaluatedKey;
                          docClient.scan(totalParams, onScan);
                      }
                  }
              }
              //get today's numbers
              var dailyParams = {
                  TableName: 'PredictionNumbers',
                  Key:{
                      "Date": today
                  }
              };
              docClient.get(dailyParams, function(err, data) {
                  if (err) {
                      console.error("Unable to read item. Error JSON:", JSON.stringify(err, null, 2));
                      console.log("106");
                  } else {
                      console.log(data);
                      if(isEmpty(data)){
                          var params = {
                              TableName: "PredictionNumbers",
                              Item: {
                                  "Date": today,
                                  "TotalDay": totalTweets,
                                  "ClintPosDay": clintPos,
                                  "TrumpPosDay": trumpPos,
                                  "TotalClintDay": clintTotal,
                                  "TotalTrumpDay":trumpTotal
                              }
                          };
                          docClient.put(params, function(err, data) {
                              if (err) {
                                  console.error("Unable to add predictions", ". Error JSON:", JSON.stringify(err, null, 2));
                                  console.log("118");
                              } else {
                                  console.log("PutItem succeeded");
                                  stream.start();
                                  started = true;
                              }
                          });
                      }else{
                          totalTweets = data.Item.TotalDay;
                          clintPos = data.Item.ClintPosDay;
                          trumpPos = data.Item.TrumpPosDay;
                          trumpTotal = data.Item.TotalTrumpDay;
                          clintTotal = data.Item.TotalClintDay;
                         // console.log(totalTweets);
                         stream.start();
                         started = true;
                      }
                  }
              });
          }

          var query = req.query.q;
          natural.PorterStemmer.attach();
          var userId = randomstring.generate();
          users.push(userId);

          res.render('search', {title: "Election Predictor", userId: userId});
          console.log("Good so far: ");
          stream.on('tweet', function (tweet) {
              console.log(tweet.text);
              if (io.engine.clientsCount == 0 && started) {
                  console.log('in here on stoped');
                  started = false;
                  // stream.stop();
                  var today = new Date();
                  var dd = today.getDate();
                  var mm = today.getMonth()+1;
                  var yyyy = today.getFullYear();
                  today = dd+'/'+mm+'/'+yyyy;
                  today = today.toString();
                  var params = {
                      TableName:'PredictionNumbers',
                      Key:{
                          "Date": today
                      },
                      UpdateExpression:"set ClintPosDay = :c, TrumpPosDay= :t, TotalDay=:d,TotalTrumpDay= :ttd, TotalClintDay=:tcd ",
                      ExpressionAttributeValues:{
                          ":d":totalTweets,
                          ":c":clintPos,
                          ":t":trumpPos,
                          ":ttd":trumpTotal,
                          ":tcd":clintTotal
                      },
                      ReturnValues:"UPDATED_NEW"
                  };

                  docClient.update(params, function(err, data) {
                      if (err) {
                          console.error("Unable to update item. Error JSON:", JSON.stringify(err, null, 2));
                          console.log("255");
                      } else {
                          console.log(data);
                          console.log("UpdateItem succeeded:", JSON.stringify(data, null, 2));
                      }
                  });

              } else {
                  totalTweets += 1;
                  EveryDayTotal += 1;
                  //console.log("Total tweets: " + totalTweets);
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
                      if(x == 2){
                          EveryDayTotalClint += 1;
                          clintTotal +=1;
                          clintonId = tweetid;
                          if(clas == 4){
                              clintPos +=1;
                              EveryDayClint += 1;
                          }
                      }else{
                          EveryDayTotalTrump += 1;
                          trumpTotal +=1;
                          trumpId = tweetid;
                          if(clas == 4){
                              trumpPos +=1;
                              EveryDayTrump += 1;
                          }
                      }
                  }
                  else if(tweetxt.includes("trump")){
                      EveryDayTotalTrump += 1;
                      trumpTotal += 1;
                      trumpId = tweetid;
                      if(clas = 4){
                          trumpPos += 1;
                          EveryDayTrump += 1;
                      }
                  }else{
                      EveryDayTotalClint += 1;
                      clintTotal +=1;
                      if (clas == 4){
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
                      trumpTweetNumber:trumpPos,
                      clintonTweetNumber:clintPos,
                      otherTweets:otherTweets,
                      EveryDayTrump: EveryDayTrump,
                      EveryDayClint: EveryDayClint,
                      EveryDayTotal: EveryDayTotal,
                      otherTweetsTotal: otherTweetsTotal,
                      clintNeg: clintNeg,
                      trumpNeg: trumpNeg,
                      EveryDayClintNeg: EveryDayClintNeg,
                      EveryDayTrumpNeg: EveryDayTumpNeg

                  };

                  io.emit("tweet", emit);
              }

            });
              stream.on("error", function (error) {
                  console.log(error);
                  if(error == "Error: unexpected end of file"){
                    // Random error, stops the stream, saves all data and restart
                    // stream.stop();
                    var today = new Date();
                    var dd = today.getDate();
                    var mm = today.getMonth()+1;
                    var yyyy = today.getFullYear();
                    today = dd+'/'+mm+'/'+yyyy;
                    today = today.toString();
                    var params = {
                        TableName:'PredictionNumbers',
                        Key:{
                            "Date": today
                        },
                        UpdateExpression:"set ClintPosDay = :c, TrumpPosDay= :t, TotalDay=:d,TotalTrumpDay= :ttd, TotalClintDay=:tcd ",
                        ExpressionAttributeValues:{
                            ":d":totalTweets,
                            ":c":clintPos,
                            ":t":trumpPos,
                            ":ttd":trumpTotal,
                            ":tcd":clintTotal
                        },
                        ReturnValues:"UPDATED_NEW"
                    };
                    docClient.update(params, function(err, data) {
                        if (err) {
                            console.error("Unable to update item. Error JSON:", JSON.stringify(err, null, 2));
                            console.log("311");
                        } else {
                            console.log(data);
                            console.log("UpdateItem succeeded:", JSON.stringify(data, null, 2));
                            // Restars server here ----
                            pm2.restart('bin/www', function () {
                                console.log("Restarted");
                                var restartEmit = {refresh:true};
                                io.emit('restart', restartEmit);

                            });
                        }
                    });
                  }
            });
        });


function isEmpty(obj){
    for(var prop in obj){
        if(obj.hasOwnProperty(prop)){
            return false;
        }
    }
    return true;
}

    return router;
};
