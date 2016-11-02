/**
 * Created by Andreas on 02-Nov-16.
 */

/// ################## CREATE DATABASE

/*
 var table = "Prediction";

 var Today = '30/10/2016';

 var params = {
 TableName:table,
 Key:{
 "Date":Today
 },
 ConditionExpression:"TrumpPosDay > :val",
 ExpressionAttributeValues: {
 ":val": 5.0
 }
 };

 console.log("Attempting a conditional delete...");
 docClient.delete(params, function(err, data) {
 if (err) {
 console.error("Unable to delete item. Error JSON:", JSON.stringify(err, null, 2));
 } else {
 console.log("DeleteItem succeeded:", JSON.stringify(data, null, 2));
 }
 });*/
/*
 var params = {
 TableName: 'Predictions',
 Key:{
 "Key": 'jsadfjj2323jkds'
 }
 };
 docClient.get(params, function(err, data) {
 if (err) {
 console.error("Unable to read item. Error JSON:", JSON.stringify(err, null, 2));
 } else {
 console.log("GetItem succeeded:", JSON.stringify(data, null, 2));
 }
 });

 var params = {
 TableName: "Predictions",
 Item: {
 "Key": "jsadfjj2323jkds",
 "Total": 567 ,
 "ClintPos": 127,
 "TrumpPos":  57
 }
 };
 docClient.put(params, function(err, data) {
 if (err) {
 console.error("Unable to add predictions", ". Error JSON:", JSON.stringify(err, null, 2));
 } else {
 console.log("PutItem succeeded:");
 }
 });*/
/*
 var params = {
 TableName : "PredictionNumbers",
 KeySchema: [
 { AttributeName: "Date", KeyType: "HASH"}],
 AttributeDefinitions: [
 { AttributeName: "Date", AttributeType: "S" }
 ],
 ProvisionedThroughput: {
 ReadCapacityUnits: 10,
 WriteCapacityUnits: 10
 }
 };

 dynamodb.createTable(params, function(err, data) {
 if (err) {
 console.error("Unable to create table. Error JSON:", JSON.stringify(err, null, 2));
 } else {
 console.log("Created table. Table description JSON:", JSON.stringify(data, null, 2));
 }
 });*/


//////////////////// #################### CLASIFIER TRAINING


// var fs = require('fs'), filename = "./positiveUse.txt";
// classifier = new natural.BayesClassifier();
//
// fs.readFile(filename, 'utf8', function(err, data) {
// if (err) throw err;
// console.log('OK: ' + filename);
//
// line = data.split("\n");
// list = [];
// for(var i=0; i<line.length; i++){
// sentiment = line[i][2];
// tweetText = line[i].substring(7, line[i].length - 4);
// list.push([sentiment, tweetText]);
// }
//
// for(var j =0; j < list.length; j++){
// natural.PorterStemmer.attach();
// var tokentweet = list[j][1];
// tokentweet = tokentweet.tokenizeAndStem();
// var finalTweetString = "";
// for(var x=0; x<tokentweet.length; x++ ){
// finalTweetString += tokentweet[x] + " ";
// }
// classifier.addDocument(finalTweetString,list[j][0]);
// }
// classifier.train();
// classifier.save('classifier.json', function(err, classifier) {
// // the classifier is saved to the classifier.json file!
// });
// var check = 'I like icecream';
// console.log(check);
// console.log(classifier.classify(check));
// console.log(classifier.getClassifications(check));
// });

