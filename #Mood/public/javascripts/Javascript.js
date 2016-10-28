var socket = io('http://localhost:3001');

var negTweetCount = 0;
var posTweetCount = 0;
var UserId = 0;
var precentage = '';

$('#posCheck').click(function(){
    if (this.checked) {
        $('#postweets').hide();
    }else{
        $('#postweets').show();
    }
});
$('#negCheck').click(function(){
    if (this.checked) {
        $('#negtweets').hide();
    }else{
        $('#negtweets').show();
    }
});
$( document ).ready(function() {
    UserId = $('#hiddenfield').val();
    socket.on(UserId, function (msg) {
        var tweet = '<amp-twitter width=600 height=850 layout="responsive" data-tweetid='+msg.tweetId+' data-cards="summary_large_image"> <blockquote id ="blockq" placeholder class="twitter-tweet" data-lang="en"> <p lang="en" dir="ltr" id="p"> <a id="l" class="list-group-item" href="https://twitter.com/'+msg.accountName+'/status/'+msg.tweetId+'">'+msg.tweet+'</a></p> </blockquote> </amp-twitter>';
        if(msg.clas == 0) {
            negTweetCount += 1;
            precentagepos = (posTweetCount/(posTweetCount+negTweetCount))*100;
            $('#precentage').text('Precentage positive: '+parseFloat(Math.round(precentagepos * 100) / 100).toFixed(2)+'%');
            $('#negTweetCount').text(negTweetCount);
            twttr.widgets.createTweet(
                msg.tweetId,
                document.getElementById('negtweets'),{
                    theme:'light'
                }
            );
        }else if(msg.clas == 4){
            posTweetCount += 1;
            precentagepos = (posTweetCount/(posTweetCount+negTweetCount))*100;
            precentage = precentagepos +'%';
            $('#precentage').text('Precentage positive: '+parseFloat(Math.round(precentagepos * 100) / 100).toFixed(2)+'%');
            $('#posTweetCount').text(posTweetCount);
            twttr.widgets.createTweet(
                msg.tweetId,
                document.getElementById('postweets'),{
                    theme:'light'
                });
        }
    });
});

