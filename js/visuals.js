//This visuals script is used to display data to the canvas in the index.html file.
//The basic idea is using green and red circles to represent the transitivity of a relationship, plotting them over time.


//TODOS
// TODO : Show all four triads concurrently on the graph. [done]
//          - Revise for correctness
// TODO : Condense some functions
// TODO : Zoom level slider for the graph.
// TODO : Statistics
//          - Total Time Triad is in transitive/intransitivite states (and stats on that)    
//                  - Which stats?    

// Considerations:
// Bars vs Observation Plots
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

//The last loadedCSV file; global access
var savedCSV;

//These get constantly updated; used for determining times of transitivity
var transStart = -1,  transEnd = -1;
var intraStart = -1, intraEnd = -1;


//Objects holding stats on transitivity
var statsTrans =
{
    'totalTime_123': 0,
    'totalTime_234': 0,
    'totalTime_341': 0,
    'totalTime_412': 0
};

var statsIntrans =
{
    'totalTime_123': 0,
    'totalTime_234': 0,
    'totalTime_341': 0,
    'totalTime_412': 0
};

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
            loadedCSV = savedCSV = csv;
            parseCSV(loadedCSV);
            $("#filterswitch").attr("disabled", false);
            updateFilter();            
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

//Split the csv on a per-line basis.
function parseCSV(inputFile)
{

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

                //Old, using the selectors at the top.
                plotOnCanvas(aMap1, aMap2, aMap3, aStr2, aStr1, 8, "123");
                
                // plotOnCanvas(fishRelations[1], fishRelations[2], fishRelations[3], "2", "1", 8,  "123");
                // plotOnCanvas(fishRelations[2], fishRelations[3], fishRelations[4], "3", "2", 33, "234");
                // plotOnCanvas(fishRelations[3], fishRelations[4], fishRelations[1], "4", "3", 61, "341");
                // plotOnCanvas(fishRelations[4], fishRelations[1], fishRelations[2], "1", "4", 86, "412");

                mapRelation(obs);
            }
        }
            
    }

    dataAvaialble = true;
    fillInTable();
}

//Plots little ticks to represent units of time.
function plotTimepoints()
{
    var ctx = canvas.getContext("2d");
    ctx.beginPath();
    ctx.rect(0, 110, canvas.width, 1);
    ctx.fillStyle = "#000000";
    ctx.fill();


    //Plot the numbers, too!
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
function plotOnCanvas(cMap1, cMap2, cMap3, cString2, cString1, yOffset, triad)
{
       var xOffset = 0;
       var ctx = canvas.getContext("2d");

        ctx.beginPath();

        var color = "#000000";
        //Do some testing here
        if(isTransitive(cMap1, cMap2, cMap3, cString2, cString1))
        {
            if(transStart == -1)
                transStart = timestamps[timestamps.length - 1];

            //Confirm intransitive period has ended
            if(intraStart != -1 && intraEnd == -1)
            {
                 intraEnd = timestamps[timestamps.length - 1];
                 console.log(intraStart + " (IT Start)");
                 console.log(intraEnd   + " (IT End)");
                 plotTransTimePeriod(xOffset, yOffset, "intrans", triad);
            }

            color = "#00ff00";
            ctx.fillStyle = color;

            //Uncomment this to draw transitive data points
            //ctx.arc(xOffset + timestamps[timestamps.length - 1], 50, 5, 0, 360);
            
            ctx.fill();
        }

        else if(isIntransitive(cMap1, cMap2, cMap3, cString2, cString1))
        {
            if(intraStart == -1)
                intraStart = timestamps[timestamps.length - 1];

            //Confirm transitive period has ended
            if(transStart != -1 && transEnd == -1)
            {
                 transEnd = timestamps[timestamps.length - 1];
                 console.log(transStart + " (Start)");
                 console.log(transEnd   + " (End)");
                 plotTransTimePeriod(xOffset, yOffset, "trans", triad);
            }
            color = "#ff0000";

            //Uncomment this to draw intransitive data points
            // ctx.arc(xOffset + timestamps[timestamps.length - 1], 50, 5, 0, 360);

            ctx.fillStyle = color;
            ctx.fill();
        }

        //Not enough info to determine transitivity
        else
        {
            if(transStart != -1 && transEnd == -1)
            {
                
                 transEnd = timestamps[timestamps.length - 1];
                 console.log(transStart + " (Start)");
                 console.log(transEnd   + " (End)");
                 plotTransTimePeriod(xOffset, yOffset, "trans", triad);
            }

                
            else if(intraStart != -1 && intraEnd == -1)
            {
                 intraEnd = timestamps[timestamps.length - 1];
                 console.log(intraStart + " (IT Start)");
                 console.log(intraEnd   + " (IT End)");
                 plotTransTimePeriod(xOffset, yOffset, "intrans", triad);
            }

            //Uncomment this to draw these "not-enough-info" data points
            // ctx.arc(xOffset + timestamps[timestamps.length - 1], 75, 5, 0, 360);
            ctx.fillStyle = "#000000";
            ctx.fill();
            //plotTransTimePeriod(xOffset);            
        }
        
           
        
   
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

//Takes 3 connex maps and then checks entries against each other for intransitivity.
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
    console.log(triadFish1);
    console.log(triadFish2);
    console.log(triadFish3);    
    aStr2 = triadFish2;
    aStr1 = triadFish1;

    initStats();
    clearCanvasAndUpdate();
}

function clearCanvasAndUpdate()
{
    var ctx = canvas.getContext("2d");
    ctx.clearRect(0,0, canvas.width, canvas.height);
    $("#dispPanel").text("Data Display: " + triadFish1 + "-" + triadFish2 + "-" + triadFish3 + " triad");
    plotTimepoints();
    
    if(savedCSV != undefined)
        parseCSV(savedCSV);
}

//Plots a line from the start of a transitivity period to its end.
//NOTE TO SELF: Consider condensing the delta calculation stuff down into its own function.
function plotTransTimePeriod(xOff, yOff, mode, triad)
{
    var ctx = canvas.getContext("2d");
    var delta;
    var style;
    if(mode == "trans")
    {
        delta = transEnd - transStart;

        //Add to the stats of the corresponding triad!
        switch(triad)
        {
            case "123":
                statsTrans.totalTime_123 += delta;
                break;

            case "234":
                statsTrans.totalTime_234 += delta;
                break;

            case "341":
                statsTrans.totalTime_341 += delta;
                break;
            
            case "412":
                statsTrans.totalTime_412 += delta;
                break;
        }

        style = "#00ee00";

        ctx.beginPath();
        ctx.strokeStyle = ctx.fillStyle = style;
        ctx.fillRect(xOff + transStart, yOff, transEnd - (xOff + transStart), yOff);
        // ctx.moveTo(xOff + transStart, 10);
        // ctx.lineTo(transEnd, 10);
        //ctx.stroke();


        ctx.font = "bold 13px Arial";   
        ctx.fillStyle = style;
        ctx.fill();
        ctx.fillText(delta + " sec", transStart, yOff + 20);
        ctx.closePath();

        transStart = -1;
        transEnd = -1;
        ctx.closePath();
    }

    if(mode == "intrans")
    {
        delta = intraEnd - intraStart;

        switch(triad)
        {
            case "123":
                statsIntrans.totalTime_123 += delta;
                break;

            case "234":
                statsIntrans.totalTime_234 += delta;
                break;

            case "341":
                statsIntrans.totalTime_341 += delta;
                break;
            
            case "412":
                statsIntrans.totalTime_412 += delta;
                break;
        }

        style = "#ee0000";

        ctx.beginPath();
        ctx.strokeStyle = ctx.fillStyle = style;
        ctx.fillRect(xOff + intraStart, yOff, intraEnd - (xOff + intraStart), yOff);         
        // ctx.moveTo(xOff + intraStart, 10);
        // ctx.lineTo(intraEnd, 10);
        ctx.stroke();


        ctx.font = "bold 13px Arial";   
        ctx.fillStyle = style;
        ctx.fill();
        ctx.fillText(delta + " sec", intraStart, yOff + 20);
        ctx.closePath();

        intraStart = -1;
        intraEnd = -1;
        ctx.closePath();
    }
    
    
    
   
}

function initStats()
{
    transEnd = transStart = intraEnd = intraStart = -1;
    $.each(statsTrans, function(index, value)
    {
        statsTrans[index] = 0;
    });
    
    $.each(statsIntrans, function(index, value)
    {
        statsIntrans[index] = 0;
    });
}

function fillInTable()
{
    $("#tri123-tr").text(statsTrans.totalTime_123);
    $("#tri123-in").text(statsIntrans.totalTime_123);

    $("#tri234-tr").text(statsTrans.totalTime_234);
    $("#tri234-in").text(statsIntrans.totalTime_234);

    $("#tri341-tr").text(statsTrans.totalTime_341);
    $("#tri341-in").text(statsIntrans.totalTime_341);

    $("#tri412-tr").text(statsTrans.totalTime_412);
    $("#tri412-in").text(statsIntrans.totalTime_412);
    
}