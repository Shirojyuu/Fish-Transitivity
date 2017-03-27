//This visuals script is used to display data to the canvas in the index.html file.
//The basic idea is using green and red circles to represent the transitivity of a relationship, plotting them over time.


//TODOS
// TODO : Contiguous bars
// TODO : Zoom level slider for the graph.
//          - Fix display according to zoom
// TODO : Statistics
//          - Total Time Triad is in transitive/intransitivite states (and stats on that)    
//                  - Which stats? - Avg Time trans/intrans per triad; Total in all groups (avg) 
//                  - Use Excel to total stuff

// Considerations:
// Bars vs Observation Plots
var canvas;
var loadedCSV;

var timestamps = [];
var observations = [];
var dataAvaialble = false;

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

//A list defining the connections between fish in a binary sense. 
//Used to construct the triads that get compared.
var edgeList =
{
    'one_two' : 0,
    'one_three' : 0,
    'one_four' : 0,

    'two_one' : 0,
    'two_three' : 0,
    'two_four' : 0,

    'three_one' : 0,
    'three_two' : 0,
    'three_four': 0,

    'four_one' : 0,
    'four_two' : 0,
    'four_three' : 0

}

//Placeholders for when the triads are established
var triad123, triad234, triad341, triad412;

$(document).ready
{
    init();
    initStats();
}

function init()
{
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
                mapRelation(obs);

                plotOnCanvas(triad123, 8, 16, "123");
                plotOnCanvas(triad234, 33, 41, "234");
                plotOnCanvas(triad341, 61, 69, "341");
                plotOnCanvas(triad412, 86, 94, "412");
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
    
    //Labels for the triads
    ctx.fillStyle = "#000000";
    ctx.fill();
            
    ctx.fillText("1-2-3", 10, 8);
    ctx.fillText("2-3-4", 10, 33);
    ctx.fillText("3-4-1", 10, 61);
    ctx.fillText("4-1-2", 10, 86);


    ctx.beginPath();
    ctx.rect(50, 110, canvas.width + 50, 1);
    ctx.fillStyle = "#000000";
    ctx.fill();


    //Plot the numbers, too!
    ctx.font = "10px Arial";
    for(var i = 50; i < canvas.width; i++)
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
function plotOnCanvas(plotTriad, yOffset, yEnd, triad)
{
       var xOffset = 0;
       var ctx = canvas.getContext("2d");

        ctx.beginPath();

        var color = "#000000";
        //Do some testing here

        if(isTransitive(plotTriad))
        {
            if(transStart == -1)
                transStart = timestamps[timestamps.length - 1];

            //Confirm intransitive period has ended
            if(intraStart != -1)
            {
                 intraEnd = timestamps[timestamps.length - 1];
                 plotTransTimePeriod(xOffset, yOffset, yEnd, "intrans", triad);
            }
        }

        if(isIntransitive(plotTriad))
        {
            if(intraStart == -1)
                intraStart = timestamps[timestamps.length - 1];

            //Confirm transitive period has ended
            if(transStart != -1)
            {
                 transEnd = timestamps[timestamps.length - 1];
                //  console.log(transStart + " (Start)");
                //  console.log(transEnd   + " (End)");
                
                 plotTransTimePeriod(xOffset, yOffset, yEnd, "trans", triad);
            }
        }
        
   
        ctx.closePath();
}

//Takes an observation, ob, and builds a mapping between the acting fish and receiving fish

function mapRelation(ob)
{
    var interactions = ob.split(" ");
    var act = interactions[0];
    var rcv = interactions[2];

    switch(act)
    {
        case "1":
            if(rcv == "2")
            {
                edgeList.one_two = 1;
                edgeList.two_one = 0;
            }
            else if(rcv == "3")
            {
                edgeList.one_three = 1;
                edgeList.three_one = 0;
            }
            else if(rcv == "4")
            {
                edgeList.one_four = 1;
                edgeList.four_one = 0;
            }
            break;
        
        case "2":
            if(rcv == "1")
            {
                edgeList.two_one = 1;
                edgeList.one_two = 0;
            }
            else if(rcv == "3")
            {
                edgeList.two_three = 1;
                edgeList.three_two = 0;
            }
            else if(rcv == "4")
            {
                edgeList.two_four = 1;
                edgeList.four_two = 0;
            }
            break;

        case "3":
            if(rcv == "1")
            {
                edgeList.three_one = 1;
                edgeList.one_three = 0;
            }
            else if(rcv == "2")
            {
                edgeList.three_two = 1;
                edgeList.two_three = 0;
            }
            else if(rcv == "4")
            {
                edgeList.three_four = 1;
                edgeList.four_three = 0;
            }
            break;

        case "4":
            if(rcv == "1")
            {
                edgeList.four_one = 1;
                edgeList.one_four = 0;
            }
            else if(rcv == "2")
            {
                edgeList.four_two = 1;
                edgeList.two_four = 0;
            }
            else if(rcv == "3")
            {
                edgeList.four_three = 1;
                edgeList.three_four = 0;
            }
            break;
    }

//Now, build a triad from the edge list, with 6 total entries for each direction of the arrows
    triad123 = [
        edgeList.one_two, edgeList.two_one,
        edgeList.two_three, edgeList.three_two,
        edgeList.three_one, edgeList.one_three
    ];

    triad234 = [
        edgeList.two_three, edgeList.three_two,
        edgeList.three_four, edgeList.four_three,
        edgeList.four_two, edgeList.two_four
    ];

    triad341 = [
        edgeList.three_four, edgeList.four_three,
        edgeList.four_one, edgeList.one_four,
        edgeList.one_three, edgeList.three_one
        
    ];

    triad412 = [
        edgeList.four_one, edgeList.one_four,
        edgeList.one_two, edgeList.two_one,
        edgeList.two_four, edgeList.four_two
    ];
}

//Takes 3 connex maps and then checks entries against each other for transitivity.
function isTransitive(testTriad)
{
    //Three configurations for being transitive:
    var config1 = [1, 0, 1, 0, 0, 1];
    var config2 = [1, 0, 0, 1, 1, 0];
    var config3 = [0, 1, 0, 1, 1, 0];

    if(isSame(testTriad, config1) || isSame(testTriad, config2) || isSame(testTriad, config3))
        return true;
    
    return false;
}

//Takes 3 connex maps and then checks entries against each other for intransitivity.
function isIntransitive(testTriad)
{
    //Two configurations for being intransitive:
    var config1 = [1, 0, 1, 0, 1, 0];
    var config2 = [0, 1, 0, 1, 0, 1];

    if(isSame(testTriad, config1) || isSame(testTriad, config2))
        return true;
    
    return false;
}

function clearCanvasAndUpdate()
{
    var ctx = canvas.getContext("2d");
    ctx.clearRect(0,0, canvas.width, canvas.height);
    plotTimepoints();
    
    if(savedCSV != undefined)
        parseCSV(savedCSV);
}

//Plots a line from the start of a transitivity period to its end.
//NOTE TO SELF: Consider condensing the delta calculation stuff down into its own function.
function plotTransTimePeriod(xOff, yOff, yEnd, mode, triad)
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
        ctx.fillRect(xOff + transStart, yOff, transEnd - (xOff + transStart), (yEnd - yOff));
        ctx.closePath();

        

        ctx.beginPath();
        ctx.font = "bold 13px Verdana";   
        ctx.fillStyle = style;
        ctx.fill();
        ctx.fillText(delta + " sec", transStart,  yOff);
        ctx.closePath();

        transStart = -1;
        transEnd = -1;
        return;
       
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
        ctx.fillRect(xOff + intraStart, yOff, intraEnd - (xOff + intraStart), (yEnd - yOff));         
        ctx.closePath();


        ctx.font = "bold 13px Verdana";   
        ctx.fillStyle = style;
        ctx.fill();
        ctx.fillText(delta + " sec", intraStart, yOff);
        ctx.closePath();

        intraStart = -1;
        intraEnd = -1;
        return;
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

//Helper
function isSame(array1, array2)
{
    var same;
    if((array1.length == array2.length))
    {
        same = array1.every(function(element, index) 
        {
            return element === array2[index];
        });
    }

    return same;
}