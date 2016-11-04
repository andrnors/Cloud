var socket = io();      //getting socket.io to work on client side
//different variables for showing in the graph
var negTweetCount = 0;
var posTweetCount = 0;
var precentageTrump = "";
var percentageClinton = "";
var chart = "";
var options = "";
var data = "";
var chart2 = "";
var options2 = "";
var data2 = "";
var loaded = false; //is set to true when our cake diagrams have finished loading in and are ready for use
var loaderVal = 50; //initial value of the slider bar

$(document).ready(function () {
    $(function () {                         //initializing the slider bar
        var handle = $("#custom-handle");
        $("#slider").slider({
            range: "min",
            value: 50,
            min: 0,
            max: 100,
            create: function () {
                handle.text($(this).slider("value"));
            },
            slide: function (event, ui) {
                handle.text(ui.value);
                loaderVal = ui.value;
            },
            change: function (event, ui) {
                var parameters = {LoadValue: ui.value};
                $.post('/LoadChange', parameters, function (data) {  //when letting go of the variable this send an ajax post request to the server with that loader value chaning the load on the server.
                });
            }
        });
    });


    socket.on("tweet", function (msg) {     //when we recieve a tweet from socket.io
        var tweet = '<amp-twitter width=600 height=850 layout="responsive" data-tweetid=' + msg.tweetId + ' data-cards="summary_large_image"> <blockquote id ="blockq" placeholder class="twitter-tweet" data-lang="en"> <p lang="en" dir="ltr" id="p"> <a id="l" class="list-group-item" href="https://twitter.com/' + msg.accountName + '/status/' + msg.tweetId + '">' + msg.tweet + '</a></p> </blockquote> </amp-twitter>';
        if (loaded) {                         //if the diagrams have actually loaded.

            data = google.visualization.arrayToDataTable([      //values to put in the diagram for the current day
                ['Yo', 'Number of positive and negative tweets'],
                ['Positive Hillary', msg.clintonTweetNumber],
                ['Negative Hillary', msg.clintNeg],
                ['Positive Trump', msg.trumpTweetNumber],
                ['Negative Trump', msg.trumpNeg]
            ]);
            options = {
                title: 'Total tweets today: ' + msg.totalTweets,
                is3D: true
            };
            chart.draw(data, options);

            data2 = google.visualization.arrayToDataTable([         //values to put into the prognosis diagram
                ['Yo', 'Number of positive and negative tweets'],
                ['Positive Hillary', msg.EveryDayClint],
                ['Negative Hillary', msg.EveryDayClintNeg],
                ['Positive Trump', msg.EveryDayTrump],
                ['Negative Trump', msg.EveryDayTrumpNeg]
            ]);
            options2 = {
                title: 'Prognosis: ' + msg.EveryDayTotal,
                is3D: true
            };
            chart2.draw(data2, options2);                       //draw the chart
        }
        if (msg.trumpId == msg.tweetId) {                   //push in the tweet in the trump list if it is a trump tweet

            $('#negTweetCount').text(msg.tweetsTotalTrump);
            $("#trumptweets").prepend("<li>" + tweet + "</li>");

            var listLength = $('#trumptweets li').length;
            if (listLength > 50) {                            //if the list is longer than 50 remove the last element to avoid huge amounts of load on the browser.
                $('#trumptweets li:last').remove();
            }

        } else if (msg.clintonId == msg.tweetId) {           //same approach as with the trump tweets, just here with hillary
            $('#posTweetCount').text(msg.tweetsTotalClinton);
            $("#clintontweets").prepend("<li>" + tweet + "</li>");
            var listLength = $('#clintontweets li').length;
            if (listLength > 50) {
                $('#clintontweets li:last').remove();
            }
        }
    });


    google.charts.load('current', {'packages': ['corechart']});
    google.charts.setOnLoadCallback(initChart);                 //asynchronously load in the charts from the google.charts api and in the callback function initialize them
    function initChart() {
        chart = new google.visualization.PieChart(document.getElementById('piechart'));
        chart2 = new google.visualization.PieChart(document.getElementById('piechart2'));
        loaded = true;
    }
});
