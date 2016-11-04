// This code is for our streaming server. It constantly runs the stream and every tweet object we recieve is parsed into the data
// we actually need and that data is sent to the queue which in turns sends the tweets to the instances upon request.
var express  = require('express');
var app      = express();
var aws      = require('aws-sdk');
var queueUrl = "https://sqs.us-west-2.amazonaws.com/895470307141/TweetQueue";   //url of the sqs queue
var Twit = require('twit');
var pm2 = require("pm2");
aws.config.loadFromPath(__dirname + '/config.json');    // Loads the AWS credentials and try to instantiate the object.

var sqs = new aws.SQS();    // Instantiate SQS.

var T = new Twit({                     //initialize th twit variable with the api keys
    consumer_key: '8uCnElCvIFMhfuAJbglIiMa2F',
    consumer_secret: 'U96g5T8vKT02dcpS1IJdC8u0jr5mr5CtfvoMyBRCenSJsefDLX',
    access_token: '340578742-7kM8czY04wrBjDYmouTmTK74dq0sCUgVo2tt4tps',
    access_token_secret: 'UYb6i3lUQ4yHXxH9q4ujlM6HHNVAn5mz6KjIKbzJNiasI'
});
var stream = T.stream('statuses/filter', {language: 'en', track: ["clinton", "trump"]});

stream.on('tweet', function (tweet) {   //do every time we recieve a tweet

    var tweetObj = {tweetId:tweet.id_str,accountName:tweet.user.screen_name,tweetText:tweet.text};  //get only the tweet info we want
    var params = {                                                                                  //parameters to send to the queue
        MessageBody: JSON.stringify(tweetObj),
        QueueUrl: queueUrl,
        DelaySeconds: 0
    };

    sqs.sendMessage(params, function (err, data) {
        if (err) {
            console.log(err);
        }
    });

});

stream.on("error", function (error) {               //upon the twitter error "unexpected end of file" we restart the server with pm2.
    if(error == "Error: unexpected end of file"){
        pm2.restart("app.js", function () {
            console.log("Server restart");

        })
    }

});

// Start server.
var server = app.listen(80, function () {
    var host = server.address().address;
    var port = server.address().port;

    console.log('AWS SQS example app listening at http://%s:%s', host, port);
});
