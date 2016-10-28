var socket = io('http://localhost:3001');

var negTweetCount = 0;
var posTweetCount = 0;
var UserId = 0;
var precentageTrump = '';
var percentageClinton ="";

$('#posCheck').click(function(){
    if (this.checked) {
        $('#clintontweets').hide();
    }else{
        $('#clintontweets').show();
    }
});
$('#negCheck').click(function(){
    if (this.checked) {
        $('#trumptweets').hide();
    }else{
        $('#trumptweets').show();
    }
});
$( document ).ready(function() {
    UserId = $('#hiddenfield').val();
    socket.on(UserId, function (msg) {
        console.log(msg.clintonId);
        var tweet = '<amp-twitter width=600 height=850 layout="responsive" data-tweetid='+msg.tweetId+' data-cards="summary_large_image"> <blockquote id ="blockq" placeholder class="twitter-tweet" data-lang="en"> <p lang="en" dir="ltr" id="p"> <a id="l" class="list-group-item" href="https://twitter.com/'+msg.accountName+'/status/'+msg.tweetId+'">'+msg.tweet+'</a></p> </blockquote> </amp-twitter>';
        if(msg.trumpId == msg.tweetId) {
            // negTweetCount += 1;
            // precentagepos = (posTweetCount/(posTweetCount+negTweetCount))*100;
            $('#percentageTrump').text('Positive percentage Trump: '+ msg.positivePercentageTrump +'%');
            $('#negTweetCount').text(negTweetCount);
            twttr.widgets.createTweet(
                msg.tweetId,
                document.getElementById('trumptweets'),{
                    theme:'light'
                }
            );
        }else if (msg.clintonId == msg.tweetId) {
    // posTweetCount += 1;
    // precentagepos = (posTweetCount/(posTweetCount+negTweetCount))*100;
    // precentage = precentagepos + '%';
    $('#percentageClinton').text('Positive percentage Clinton: ' + msg.positivePercentageClinton + '%');
    $('#posTweetCount').text(posTweetCount);
    twttr.widgets.createTweet(
        msg.tweetId,
        document.getElementById('clintontweets'), {
            theme: 'light'
        });
}
    });
});

