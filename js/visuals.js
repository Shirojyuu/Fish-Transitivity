//This visuals script is used to display data to the canvas in the index.html file.
//The basic idea is using green and red circles to represent the transitivity of a relationship, plotting them over time.

var canvas;
var loadedCSV;

var timestamps = [];
var observations = [];
var dataAvaialble = false;

var fishRelations;

//These are maps for each fish and their relation to another fish
var connexA;
var connexB;
var connexC;
var connexD;

$(document).ready
{
    init();
}

function init()
{
    connexA = new Map(), connexB = new Map(), connexC = new Map(), connexD = new Map();
    fishRelations = new Map();
    fishRelations[1] = connexA;
    fishRelations[2] = connexB;
    fishRelations[3] = connexC;
    fishRelations[4] = connexD;

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
            plotTimepoints();
        }
        reader.readAsDataURL(selectedFile);
       
        
    });

    if(dataAvaialble == true)
    {
        console.log("All done!");
    }
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
                plotOnCanvas();
                mapRelation(obs);
            }
        }
            
    }
    
    // console.log(timestamps);
    // console.log(observations);
    dataAvaialble = true;
}

//Plots little ticks to represent units of time.
function plotTimepoints()
{
    var ctx = canvas.getContext("2d");
    ctx.beginPath();
    ctx.rect(0, 110, canvas.width, 1);
    ctx.fillStyle = "#000000";
    ctx.fill();



    ctx.font = "10px Arial";
    for(var i = 0; i < canvas.width; i++)
    {
        if(i % 50 == 0)
        {
            ctx.rect(i, 115, 0.4, 5);
            ctx.fillStyle = "#000000";
            ctx.fill();
            ctx.fillText(i, i + 1, 130);
        }

    }
        ctx.closePath();

}

function plotOnCanvas()
{
       var xOffset = 0;
       var ctx = canvas.getContext("2d");

           ctx.beginPath();
           ctx.arc(xOffset + timestamps[timestamps.length - 1], 50, 5, 0, 360);

           var color = "#000000";
        //    Do some testing here
           if(isTransitive(connexC, connexB, connexA, "2", "1"))
           {
               color = "#00ff00";
           }

           else
           {
               var color = "#000000";
           }
            
           ctx.fillStyle = color;
           ctx.fill()
           ctx.closePath();
}

//Takes an observation, ob, and builds a mapping between the acting fish and receiving fish
function mapRelation(ob)
{
    //Index 0 = Actor, Index 1 = Action, Index 2 = Receiver
    var interactions = ob.split(" ");
    var act = interactions[0];
    var rcv = interactions[2];

    switch(act)
    {
        case "1":
            if(rcv == "2")
            {
                connexA[rcv] = 1;
                connexB[act] = 0;
            }
            else if(rcv == "3")
            {
                connexA[rcv] = 1;
                connexC[act] = 0;
            }
            else if(rcv == "4")
            {
                connexA[rcv] = 1;
                connexD[act] = 0;
            }
            break;
        
        case "2":
            if(rcv == "1")
            {
                connexB[rcv] = 1;
                connexA[act] = 0;
            }
            else if(rcv == "3")
            {
                connexB[rcv] = 1;
                connexC[act] = 0;
            }
            else if(rcv == "4")
            {
                connexB[rcv] = 1;
                connexD[act] = 0;
            }
            break;

        case "3":
            if(rcv == "1")
            {
                connexC[rcv] = 1;
                connexA[act] = 0;
            }
            else if(rcv == "2")
            {
                connexC[rcv] = 1;
                connexB[act] = 0;
            }
            else if(rcv == "4")
            {
                connexC[rcv] = 1;
                connexD[act] = 0;
            }
            break;

        case "4":
            if(rcv == "1")
            {
                connexD[rcv] = 1;
                connexA[act] = 0;
            }
            else if(rcv == "2")
            {
                connexD[rcv] = 1;
                connexB[act] = 0;
            }
            else if(rcv == "3")
            {
                connexD[rcv] = 1;
                connexC[act] = 0;
            }
            break;
    }
}

//Takes 3 connex maps and then checks entries against each other for transitivity.
function isTransitive(cm1, cm2, cm3, cv2, cv3)
{
    if(cm1[cv2] == 1)
    {
        if(cm2[cv3] == 1)
        {
            if(cm1[cv3] == 1)
                return true;
        }
    }

    return false;
}