var socket = io('http://localhost:3001');

var negTweetCount = 0;
var posTweetCount = 0;
var UserId = 0;
var precentageTrump = '';
var percentageClinton ="";
var chart = "";
var options = "";
var data = "";
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
//        var tweet = '<amp-twitter width=600 height=850 layout="responsive" data-tweetid='+msg.tweetId+' data-cards="summary_large_image"> <blockquote id ="blockq" placeholder class="twitter-tweet" data-lang="en"> <p lang="en" dir="ltr" id="p"> <a id="l" class="list-group-item" href="https://twitter.com/'+msg.accountName+'/status/'+msg.tweetId+'">'+msg.tweet+'</a></p> </blockquote> </amp-twitter>';
        data = google.visualization.arrayToDataTable([
            ['Yo', 'Number of positive tweets'],
            ['Positive Hillary',     msg.clintonTweetNumber],
            ['Positive Trump',      msg.trumpTweetNumber],
            ['Other',  msg.otherTweets]
        ]);
        options = {
            title: 'Total tweets: '+ msg.totalTweets,
            is3D: true
        };
        chart.draw(data, options);

        if(msg.trumpId == msg.tweetId) {
            // negTweetCount += 1;
            // precentagepos = (posTweetCount/(posTweetCount+negTweetCount))*100;
            $('#percentageTrump').text('Positive percentage Trump: '+ msg.positivePercentageTrump +'%');
            $('#negTweetCount').text(msg.tweetsTotalTrump);

           twttr.widgets.createTweet(
                msg.tweetId,
                document.getElementById('trumptweets'),{
                    theme:'light'
                }
            );
            /*var listLength = $('#trumptweets').size;
            console.log(listLength);
            if(listLength > 100){
                $('#trumptweets').first().remove();
            }*/
            //$('#trumptweets').prepend('<il>'+twet+'</il>');
        }else if (msg.clintonId == msg.tweetId) {
    // posTweetCount += 1;
    // precentagepos = (posTweetCount/(posTweetCount+negTweetCount))*100;
    // precentage = precentagepos + '%';
    $('#percentageClinton').text('Positive percentage Clinton: ' + msg.positivePercentageClinton + '%');
    $('#posTweetCount').text(msg.tweetsTotalClinton);
    twttr.widgets.createTweet(
        msg.tweetId,
        document.getElementById('clintontweets'), {
            theme: 'light'
        });
}
    });
    google.charts.load('current', {'packages':['corechart']});
    google.charts.setOnLoadCallback(initChart);
    function initChart() {


        chart = new google.visualization.PieChart(document.getElementById('piechart'));

    }
});


