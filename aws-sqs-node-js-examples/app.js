// Require objects.
var express  = require('express');
var app      = express();
var aws      = require('aws-sdk');
var queueUrl = "https://sqs.us-west-2.amazonaws.com/895470307141/TweetQueue";
var receipt  = "";
var Twit = require('twit');
var pm2 = require("pm2");
// Load your AWS credentials and try to instantiate the object.
aws.config.loadFromPath(__dirname + '/config.json');

// Instantiate SQS.
var sqs = new aws.SQS();

var T = new Twit({
    consumer_key: '8uCnElCvIFMhfuAJbglIiMa2F',
    consumer_secret: 'U96g5T8vKT02dcpS1IJdC8u0jr5mr5CtfvoMyBRCenSJsefDLX',
    access_token: '340578742-7kM8czY04wrBjDYmouTmTK74dq0sCUgVo2tt4tps',
    access_token_secret: 'UYb6i3lUQ4yHXxH9q4ujlM6HHNVAn5mz6KjIKbzJNiasI'
});
var stream = T.stream('statuses/filter', {language: 'en', track: ["clinton", "trump"]});


stream.on('tweet', function (tweet) {
    console.log(tweet);

    var tweetObj = {tweetId:tweet.id_str,accountName:tweet.user.screen_name,tweetText:tweet.text};
    var params = {
        MessageBody: JSON.stringify(tweetObj),
        QueueUrl: queueUrl,
        DelaySeconds: 0
    };

    sqs.sendMessage(params, function (err, data) {
        if (err) {
            console.log(err);
        }
        else {
            console.log(data);
        }
    });

});

stream.on("error", function (error) {
    if(error == "Error: unexpected end of file"){
        pm2.restart("app.js", function () {
            console.log("Server restart");

        })
    }

});

/*
// Creating a queue.
app.get('/create', function (req, res) {
    var params = {
        QueueName: "TweetQueue"
    };
    
    sqs.createQueue(params, function(err, data) {
        if(err) {
            res.send(err);
        } 
        else {
            res.send(data);
        } 
    });
});*/

// Listing our queues.
app.get('/list', function (req, res) {
    sqs.listQueues(function(err, data) {
        if(err) {
            res.send(err);
        } 
        else {
            res.send(data);
        } 
    });
});


// Receive a message.
// NOTE: This is a great long polling example. You would want to perform
// this action on some sort of job server so that you can process these
// records. In this example I'm just showing you how to make the call.
// It will then put the message "in flight" and I won't be able to
// reach that message again until that visibility timeout is done.
app.get('/receive', function (req, res) {
    var params = {
        QueueUrl: queueUrl,
        VisibilityTimeout: 600 // 10 min wait time for anyone else to process.
    };

    sqs.receiveMessage(params, function(err, data) {
        if(err) {
            res.send(err);
        }
        else {
            res.send(data);
        }
    });
});

// Deleting a message.
app.get('/delete', function (req, res) {
    var params = {
        QueueUrl: queueUrl,
        ReceiptHandle: receipt
    };

    sqs.deleteMessage(params, function(err, data) {
        if(err) {
            res.send(err);
        }
        else {
            res.send(data);
        }
    });
});

// Purging the entire queue.
app.get('/purge', function (req, res) {
    var params = {
        QueueUrl: queueUrl
    };

    sqs.purgeQueue(params, function(err, data) {
        if(err) {
            res.send(err);
        }
        else {
            res.send(data);
        }
    });
});

// Start server.
var server = app.listen(80, function () {
    var host = server.address().address;
    var port = server.address().port;

    console.log('AWS SQS example app listening at http://%s:%s', host, port);
});
