//This visuals script is used to display data to the canvas in the index.html file.
//The basic idea is using green and red circles to represent the transitivity of a relationship, plotting them over time.

var canvas;
var loadedCSV;

var timestamps = [];
var observations = [];

$(document).ready
{
    init();
}

function init()
{
    
    canvas = document.getElementById('dataWindow');   
    var context = canvas.getContext("2d");
    
//    context.beginPath();
//    context.arc(20, 20, 5, 0, 360);
//    context.fillStyle = "blue";
//    context.fill();
//    console.log(canvas);
//    
    //Open up the CSV file of choice
    $('#inputfile').change(function(data)
    {
        var selectedFile = $('#inputfile').get(0).files[0];
        var reader = new FileReader();
        reader.onload = function(e)
        {
            var data = e.target.result;
            var b64 = data.split('base64,')[1];
            var csv = atob(b64);
            loadedCSV = csv;
            parseCSV(loadedCSV);
            plotOnCanvas();
        }
        reader.readAsDataURL(selectedFile);
       
        
    });
}

function parseCSV(inputFile)
{
    //Split the csv on a per-line basis.
    //Data Order:
    //  video #, time (sec), converted time, observation
    
    var lines = inputFile.split("\n");
//    console.log(lines);
    
    for(var i = 0; i < lines.length; i++)
    {
        var components = lines[i].split(",");
        var tStamp =  components[1];
        var obs = components[3];
        if(typeof(obs) != 'undefined')
        {
            if(obs.indexOf("L") == -1 && obs.indexOf("panic") == -1 && obs.length < 6)
            {
                timestamps.push(tStamp);
                observations.push(obs);
            }
        }
            
    }
    
    console.log(timestamps);
    console.log(observations);
}

function plotOnCanvas()
{
       var xOffset = 0;
       var ctx = canvas.getContext("2d");
       for(var i = 0; i < timestamps.length; i++)
       {
           ctx.beginPath();
           ctx.arc(xOffset + timestamps[i], 50, 5, 0, 360);
           ctx.fillStyle = "green"
           ctx.fill()
       }
}