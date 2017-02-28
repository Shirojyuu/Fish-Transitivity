//This visuals script is used to display data to the canvas in the index.html file.
//The basic idea is using green and red circles to represent the transitivity of a relationship, plotting them over time.


//TODOS
// TODO : Display how long a triad is transitive in the dataset
// TODO : Proper clearing on the canvas
// TODO : Figure out the deal with them black dots!

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

//These are the "active" maps and selection strings that are used in the
//plotOnCanvas function.
var aMap1, aMap2, aMap3, aStr2, aStr1;
var triadFish1, triadFish2, triadFish3;

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
            $("#filterswitch").attr("disabled", false);
            plotTimepoints();
        }
        reader.readAsDataURL(selectedFile);
       
        
    });

    $("#filterswitch").click(updateFilter);
    updateFilter();
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
                plotOnCanvas(aMap1, aMap2, aMap3, aStr2, aStr1);
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

//Plots the actual data itself on the graph. Feed in the connection maps to check.
function plotOnCanvas(cMap1, cMap2, cMap3, cString2, cString1)
{
       var xOffset = 0;
       var ctx = canvas.getContext("2d");

           ctx.beginPath();
           ctx.arc(xOffset + timestamps[timestamps.length - 1], 50, 5, 0, 360);

           var color = "#000000";
        //    Do some testing here
           if(isTransitive(cMap1, cMap2, cMap3, cString2, cString1))
           {
               color = "#00ff00";
           }
    
           else if(isIntransitive(cMap1, cMap2, cMap3, cString2, cString1))
           {
               color = "#ff0000";
           }

           //Not enough info to determine transitivity
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

        else if(cm3[cv2] == 1)
        {
            if(cm1[cv2] == 1)
                return true;
        }
    }

    return false;
}

//Takes 3 connex maps and then checks entries against each other for transitivity.
function isIntransitive(cm1, cm2, cm3, cv2, cv3)
{
    if(cm1[cv2] == 0)
    {
        if(cm2[cv3] == 0)
        {
            if(cm1[cv3] == 0)
                return true;
        }

        else if(cm3[cv2] == 0)
        {
            if(cm1[cv2] == 0)
                return true;
        }
    }

    else if(cm1[cv2] == 1)
    {
        if(cm2[cv3] == 0)
        {
            if(cm1[cv3] == 0)
                return true;
        }

        else if(cm3[cv2] == 0)
        {
            if(cm1[cv2] == 0)
                return true;
        }
    }

    return false;
}

function updateFilter()
{
    var maps = [connexA, connexB, connexC, connexD];
    triadFish1 = $("#filter-1").val();
    triadFish2 = $("#filter-2").val();
    triadFish3 = $("#filter-3").val();
    
    aMap1 = fishRelations[parseInt(triadFish1)];
    aMap2 = fishRelations[parseInt(triadFish2)];
    aMap3 = fishRelations[parseInt(triadFish3)];
    console.log(aMap1);
    aStr2 = triadFish2;
    aStr1 = triadFish1;
    clearCanvasAndUpdate();
}

function clearCanvasAndUpdate()
{
    var ctx = canvas.getContext("2d");
    ctx.clearRect(0,0, canvas.width, canvas.height);
    $("#dispPanel").text("Data Display: " + triadFish1 + "-" + triadFish2 + "-" + triadFish3 + " triad");
    plotTimepoints();
    plotOnCanvas(aMap1, aMap2, aMap3, aStr2, aStr1);
}