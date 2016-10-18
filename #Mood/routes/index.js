var express = require('express');
var router = express.Router();

var Twit = require('twit');

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
    console.log(query);
    var stream = T.stream('statuses/filter', { track: [query] });

    stream.on('tweet', function (tweet) {
        console.log(tweet);
    });
    /*
    tweets = [];

    var params = {
      q: '#' + query + ' since:2011-07-11',
      count: 100
    };

    var TweetData = function (err, data) {
        if (err) {
            console.log("TweetsData failed: " + err.message)
        }
        var statuesInfo = data.statuses;
        for (var i = 0; i < statuesInfo.length; i++){
          tweets.push([statuesInfo[i].text, statuesInfo[i].id_str])
        }
        console.log(tweets);

    });

    T.get('search/tweets', params, TweetData);

    res.render("search", {
        title: "Search for #" + query
    })
*/
});


module.exports = router;
