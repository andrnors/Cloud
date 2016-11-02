var socket = io('http://localhost:3002');

var negTweetCount = 0;
var posTweetCount = 0;
var UserId = 0;
var precentageTrump = '';
var percentageClinton ="";
var chart = "";
var options = "";
var data = "";
var chart2 = "";
var options2 = "";
var data2 = "";
var loaded = false;

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
    socket.on('tweet', function (msg) {
       var tweet = '<amp-twitter width=600 height=850 layout="responsive" data-tweetid='+msg.tweetId+' data-cards="summary_large_image"> <blockquote id ="blockq" placeholder class="twitter-tweet" data-lang="en"> <p lang="en" dir="ltr" id="p"> <a id="l" class="list-group-item" href="https://twitter.com/'+msg.accountName+'/status/'+msg.tweetId+'">'+msg.tweet+'</a></p> </blockquote> </amp-twitter>';
        if(loaded){
        data = google.visualization.arrayToDataTable([
            ['Yo', 'Number of positive and negative tweets'],
            ['Positive Hillary',     msg.clintonTweetNumber],
            ['Negative Hillary',      msg.clintNeg],
            ['Positive Trump',  msg.trumpTweetNumber],
            ['Negative Trump', msg.trumpNeg]
        ]);
        options = {
            title: 'Total tweets today: '+ msg.totalTweets,
            is3D: true
        };
        chart.draw(data, options);

        data2 = google.visualization.arrayToDataTable([
            ['Yo', 'Number of positive and negative tweets'],
            ['Positive Hillary', msg.EveryDayClint],
            ['Negative Hillary', msg.EveryDayClintNeg],
            ['Positive Trump',  msg.EveryDayTrump],
            ['Negative Trump',  msg.EveryDayTrumpNeg]
        ]);
        options2 = {
            title: 'Prognosis: '+ msg.EveryDayTotal,
            is3D: true
        };
        chart2.draw(data2, options2);
        }
        if(msg.trumpId == msg.tweetId  && !msg.retweeted) {

            $('#negTweetCount').text(msg.tweetsTotalTrump);
            $("#trumptweets").prepend("<li>"+tweet+"</li>");

            var listLength = $('#trumptweets li').length;
            console.log(listLength);
            if(listLength > 50){
                $('#trumptweets li:last').remove();
            }
            
        }else if (msg.clintonId == msg.tweetId && !msg.retweeted) {
          $('#posTweetCount').text(msg.tweetsTotalClinton);
          $("#clintontweets").prepend("<li>"+tweet+"</li>");
          var listLength = $('#clintontweets li').length;
          console.log(listLength);
          if(listLength > 50){
              $('#clintontweets li:last').remove();
          }
        }
    });

    socket.on("restart", function (msg) {
        if(msg.refresh){
            location.reload();
        }
    });

    google.charts.load('current', {'packages':['corechart']});
    google.charts.setOnLoadCallback(initChart);
    function initChart() {
        chart = new google.visualization.PieChart(document.getElementById('piechart'));
        chart2 = new google.visualization.PieChart(document.getElementById('piechart2'));
        loaded = true;
    }
});
