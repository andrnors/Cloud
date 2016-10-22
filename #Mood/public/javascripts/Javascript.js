var socket = io('http://localhost:3001');

var negTweetCount = 0;
var posTweetCount = 0;
var nutTweetCount = 0;

socket.on('tweet', function (msg) {
    var tweet = '<amp-twitter width=600 height=850 layout="responsive" data-tweetid='+msg.tweetId+' data-cards="summary_large_image"> <blockquote id ="blockq" placeholder class="twitter-tweet" data-lang="en"> <p lang="en" dir="ltr" id="p"> <a id="l" class="list-group-item" href="https://twitter.com/'+msg.accountName+'/status/'+msg.tweetId+'">'+msg.tweet+'</a></p> </blockquote> </amp-twitter>';
    if(msg.clas == 0) {
        negTweetCount += 1;
        $('#negTweetsCount').val(negTweetCount);
        twttr.widgets.createTweet(
          msg.tweetId,
            document.getElementById('negtweets'),{
              theme:'light'
        }
        );
        //$('#negtweets').prepend($('<li>').innerHTML = tweet);
    }else if(msg.clas == 4){
        posTweetCount += 1;
        $('#posTweetCount').val(posTweetCount);
        twttr.widgets.createTweet(
            msg.tweetId,
            document.getElementById('postweets'),{
                theme:'light'
            });

    }else{
        nutTweetCount += 1;
        $('#nutTweetsCount').val(nutTweetCount);
        twttr.widgets.createTweet(
            msg.tweetId,
            document.getElementById('nuttweets'),{
                theme:'light'
            });

    }
});
$( document ).ready(function() {


});

