//This visuals script is used to display data to the canvas in the index.html file.
//The basic idea is using green and red circles to represent the transitivity of a relationship, plotting them over time.


//TODOS
// TODO : Zoom level slider for the graph.
//          - Fix display according to zoom

// TODO : Find out why act/rcv equality tests don't fire mapping function
        // - Get reformatted Chicken data

var canvas;
var canvScale = 1;
var wScale = 1;
var lastEntry = -1;
var loadedCSV;
var fullGraph;
var maxWidth, maxHeight;

var animalActs = [];
var timestamps = [];
var observations = [];
var dataAvaialble = false;
var autoScroll = true;
//The last loadedCSV file; global access
var savedCSV;

//These get constantly updated; used for determining times of transitivity
var transStart = 
{
    'pt123' : -1,
    'pt234' : -1,
    'pt341' : -1,
    'pt412' : -1,
},
transEnd = 
{
    'pt123' : -1,
    'pt234' : -1,
    'pt341' : -1,
    'pt412' : -1,
}

var intraStart = 
{
    'pt123' : -1,
    'pt234' : -1,
    'pt341' : -1,
    'pt412' : -1,
},
intraEnd =
{
    'pt123' : -1,
    'pt234' : -1,
    'pt341' : -1,
    'pt412' : -1,
}


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

//Delta Trans/Delta Intrans arrays for statistics. Store the delta times of transitivity
var dt_123 = [], 
    di_123 = [],
    dt_234 = [], 
    di_234 = [], 
    dt_341 = [], 
    di_341 = [], 
    dt_412 = [], 
    di_412 = [];

var totalTime;

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

$("#scaleSlider").change(function(value)
{
    console.log(canvScale);
    canvScale = $(this).val();
    canvas = document.getElementById('dataWindow');   
    canvas.width = maxWidth * canvScale;
    var ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    plotTimepoints();
    initStats();
    clearCanvasAndUpdate();
    
    
});

function init()
{
    canvas = document.getElementById('dataWindow');   
    var context = canvas.getContext("2d");
    
    maxWidth = canvas.width;
    maxHeight = canvas.height;

    //Update Action Filter
    $('#presets').change(function(data)
    {
        console.log($(this)[0].value);
        switch($(this)[0].value)
        {
            case "Fish":
                $('#actionFilter').attr('value', "T,B,C");
                break;

            case "Chicken":
                $('#actionFilter').attr('value', "P,J");
                break;
        }
    });

    $('#applyAF').click(function()
    {
        var actionString = $('#actionFilter').val();

        animalActs = actionString.split(",");
        console.log(animalActs);
    });
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
            clearCanvasAndUpdate();            
            parseCSV(loadedCSV);           
            
            
        }

        reader.readAsDataURL(selectedFile); 
    });

    $("#export").click(function()
    {
        window.open(fullGraph, "_blank");
    })
}

function update()
{
    if(autoScroll)
    {
        canvas = document.getElementById('dataWindow');          

    }
    requestAnimationFrame(update);
}
//Split the csv on a per-line basis.
function parseCSV(inputFile)
{
    
    //Data Order:
    //  video #, time (sec), converted time, observation
    var lines = inputFile.split("\n");
    
    for(var i = 0; i < lines.length; i++)
    {
        var components = lines[i].split(",");
        var tStamp =  components[1];
        var obs = components[3];
        if(typeof(obs) != 'undefined')
        {
            animalActs.forEach(function(symb) 
            {
                if(obs.indexOf(symb) != -1)
                {
                    timestamps.push(tStamp);
                    observations.push(obs);
                }
            }, this);
        }
            
    }
    
    lastEntry = timestamps[timestamps.length - 1];
    plotTimepoints();
    displayBars();
    
}

function resizeCanvas(rsWidth)
{
    var ratio = canvas.width / canvas.height;
    canvas.width = rsWidth;
}
function displayBars()
    {
     //Disgusting series of for-loops to display each bar because JS is single-threaded...
     for(var j = 0; j <= timestamps.length; j++)
     {
            if(j < timestamps.length)
            {   
                mapRelation(observations[j], "123");
                plotOnCanvas(triad123, 8, 16, "123", j);
            }

            if(j == timestamps.length)
            {
                clearEdgeList("123");
                initPeriods();
            }
     }
     for(var k = 0; k <= timestamps.length; k++)
     {
            if(k < timestamps.length)
            {   
                mapRelation(observations[k], "234");
                plotOnCanvas(triad234, 33, 41, "234", k);
            }

            if(k == timestamps.length)
            {
                clearEdgeList("234");
                initPeriods();                
            }
     }
     for(var m = 0; m <= timestamps.length; m++)
     {
            if(m < timestamps.length)
            {   
                mapRelation(observations[m], "341");
                plotOnCanvas(triad341, 61, 69, "341", m);
            }

            if(m == timestamps.length)
            {
                clearEdgeList("341");
                initPeriods();
            }
     }
     for(var n = 0; n <= timestamps.length; n++)
     {
            if(n < timestamps.length)
            {  
                mapRelation(observations[n], "412");
                plotOnCanvas(triad412, 86, 94, "412", n);
            }

            if(n == timestamps.length)
            {
                clearEdgeList("412");
                initPeriods();                
            }
     }

    totalTime = timestamps[timestamps.length - 1];
    dataAvaialble = true;
    fillInTable();
    fullGraph = canvas.toDataURL();
    $("#export").attr('disabled', false);
    requestAnimationFrame(update);
    //setupGraph();
    
}

//Plots little ticks to represent units of time.
function plotTimepoints()
{
    wScale = lastEntry / 32767;
    if(wScale > 1)
        wScale = 0.65
    console.log(wScale);
    var ctx = canvas.getContext("2d");
    
    //Labels for the triads
    ctx.fillStyle = "#000000";
    ctx.fill();
    ctx.font = "10px Arial";
    
    ctx.fillText("1-2-3", 10 * canvScale, 12 * canvScale);
    ctx.fillText("2-3-4", 10 * canvScale, 37 * canvScale);
    ctx.fillText("3-4-1", 10 * canvScale, 65 * canvScale);
    ctx.fillText("4-1-2", 10 * canvScale, 90 * canvScale);


    ctx.beginPath();
    ctx.rect(50 * canvScale * wScale, 110 * canvScale, lastEntry * canvScale * wScale, canvScale);
    ctx.fillStyle = "#000000";
    ctx.fill();


    //Plot the numbers, too!
    ctx.font = 10 * canvScale + "px Arial";
    for(var i = 0; i < lastEntry; i++)
    {
        if(i % 50 * wScale == 0)
        {
            ctx.rect(i * wScale, 115 * canvScale, 0.4 * canvScale * wScale, 5 * canvScale);
            ctx.fillStyle = "#000000";
            ctx.fill();
            ctx.fillText(i, (i + 1) * canvScale * wScale, 130 * canvScale);
        }

    }
        ctx.closePath();

}

//Plots the actual data itself on the graph. Feed in the connection maps to check.
function plotOnCanvas(plotTriad, yOffset, yEnd, triad, index)
{
    var lT_Start = 0;
    var lT_End = 0;
    var lI_Start = 0;
    var lI_End = 0;

    if(timestamps[index] == 1158)
    {
        console.log("STOP");
    }
    switch(triad)
    {
        case "123":
            lT_Start = transStart.pt123;
            lT_End = transEnd.pt123;
            lI_Start = intraStart.pt123;
            lI_End  = intraEnd.pt123;
            break;

        case "234":
            lT_Start = transStart.pt234;
            lT_End = transEnd.pt234;
            lI_Start = intraStart.pt234;
            lI_End  = intraEnd.pt234;
            break;

        case "341":
            lT_Start = transStart.pt341;
            lT_End = transEnd.pt341;
            lI_Start = intraStart.pt341;
            lI_End  = intraEnd.pt341;
            break;

        case "412":
            lT_Start = transStart.pt412;
            lT_End = transEnd.pt412;
            lI_Start = intraStart.pt412;
            lI_End  = intraEnd.pt412;
            break;
    }
    var xOffset = 0;

        //Do some testing here
        if(isTransitive(plotTriad))
        {         
            if(lT_Start == -1)
            {
                switch(triad)
                {
                    case "123":
                        transStart.pt123 = timestamps[index];            
                        break;

                    case "234":
                        transStart.pt234 = timestamps[index];            
                        break;

                    case "341":
                        transStart.pt341 = timestamps[index];            
                        break;

                    case "412":
                        transStart.pt412 = timestamps[index];            
                        break;
                }
                     
            }
              
            //Confirm intransitive period has ended
            if(lI_Start != -1)
            {
                switch(triad)
                {
                    case "123":
                        intraEnd.pt123 = timestamps[index];            
                        break;

                    case "234":
                        intraEnd.pt234 = timestamps[index];            
                        break;

                    case "341":
                        intraEnd.pt341 = timestamps[index];            
                        break;

                    case "412":
                        intraEnd.pt412 = timestamps[index];            
                        break;
                }
                 plotTransTimePeriod(xOffset * canvScale, yOffset * canvScale, yEnd * canvScale, "intrans", triad);
            }
        }
            if(index == timestamps.length - 1 && lI_Start != -1)
            {
                 switch(triad)
                {
                    case "123":
                        intraEnd.pt123 = timestamps[index];            
                        break;

                    case "234":
                        intraEnd.pt234 = timestamps[index];            
                        break;

                    case "341":
                        intraEnd.pt341 = timestamps[index];            
                        break;

                    case "412":
                        intraEnd.pt412 = timestamps[index];            
                        break;
                }
                 plotTransTimePeriod(xOffset * canvScale, yOffset * canvScale, yEnd * canvScale, "intrans", triad);
            }
        

        if(isIntransitive(plotTriad))
        {
            if(lI_Start == -1)
            {
                switch(triad)
                {
                    case "123":
                        intraStart.pt123 = timestamps[index];            
                        break;

                    case "234":
                        intraStart.pt234 = timestamps[index];            
                        break;

                    case "341":
                        intraStart.pt341 = timestamps[index];            
                        break;

                    case "412":
                        intraStart.pt412 = timestamps[index];            
                        break;
                }
            }

            //Confirm intransitive period has ended
            if(lT_Start != -1)
            {
                switch(triad)
                {
                    case "123":
                        transEnd.pt123 = timestamps[index];            
                        break;

                    case "234":                    
                        transEnd.pt234 = timestamps[index];            
                        break;

                    case "341":
                        transEnd.pt341 = timestamps[index];            
                        break;

                    case "412":
                        transEnd.pt412 = timestamps[index];            
                        break;
                }
                
                 plotTransTimePeriod(xOffset * canvScale, yOffset *canvScale, yEnd * canvScale, "trans", triad);
            }
        }
            if(index == timestamps.length - 1 && lT_Start != -1)
            {
                switch(triad)
                {
                    case "123":
                        transEnd.pt123 = timestamps[index];            
                        break;

                    case "234":
                        transEnd.pt234 = timestamps[index];            
                        break;

                    case "341":
                        transEnd.pt341 = timestamps[index];            
                        break;

                    case "412":
                        transEnd.pt412 = timestamps[index];            
                        break;
                }
                
                plotTransTimePeriod(xOffset * canvScale , yOffset *canvScale, yEnd * canvScale, "trans", triad);
            }
        

        
}

//Takes an observation, ob, and builds a mapping between the acting fish and receiving fish

function mapRelation(ob, triad)
{
    var interactions = ob.split(" ");
    var act = interactions[0].trim();
    var rcv = interactions[2].trim();

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
    switch(triad)
    {
        case "123":
            triad123 = [
                edgeList.one_two, edgeList.two_one,
                edgeList.two_three, edgeList.three_two,
                edgeList.three_one, edgeList.one_three
            ];
            break;

        case "234":
            triad234 = [
                edgeList.two_three, edgeList.three_two,
                edgeList.three_four, edgeList.four_three,
                edgeList.four_two, edgeList.two_four
            ];
            break;

        case "341":
            triad341 = [
                edgeList.three_four, edgeList.four_three,
                edgeList.four_one, edgeList.one_four,
                edgeList.one_three, edgeList.three_one
                
            ];
            break;

        case "412":
            triad412 = [
                edgeList.four_one, edgeList.one_four,
                edgeList.one_two, edgeList.two_one,
                edgeList.two_four, edgeList.four_two
            ];
            break;
    }
}

//Takes a triad and then checks entries against configurations for transitivity.
function isTransitive(testTriad)
{
    //Three configurations for being transitive:
    var config1 = [1, 0, 1, 0, 0, 1];
    var config2 = [1, 0, 0, 1, 1, 0];
    var config3 = [0, 1, 0, 1, 1, 0];
    var config4 = [1, 0, 0, 1, 0, 1];    

    if(isSame(testTriad, config1) || isSame(testTriad, config2) || isSame(testTriad, config3) || isSame(testTriad, config4))
        return true;
    
    return false;
}

//Takes a triad and then checks entries against configurations for intransitivity.
function isIntransitive(testTriad)
{
    //Two configurations for being intransitive:
    var config1 = [1, 0, 1, 0, 1, 0];
    var config2 = [0, 1, 0, 1, 0, 1];
    var config3 = [0, 1, 1, 0, 0, 1];    

    if(isSame(testTriad, config1) || isSame(testTriad, config2) || isSame(testTriad, config3))
        return true;
    
    return false;
}

function clearCanvasAndUpdate()
{
    var ctx = canvas.getContext("2d");
    ctx.clearRect(0,0, canvas.width, canvas.height);
    
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
    var end, start;
    if(mode == "trans")
    {
        
        //Add to the stats of the corresponding triad!
        switch(triad)
        {
            case "123":
                end = transEnd.pt123;
                start = transStart.pt123;
                delta = Math.abs(end - start);    
                statsTrans.totalTime_123 += delta;
                dt_123.push(delta);
                transStart.pt123 = -1;
                transEnd.pt123 = -1;
                break;

            case "234":
                end = transEnd.pt234;
                start = transStart.pt234;
                delta = Math.abs(end - start); 
                statsTrans.totalTime_234 += delta;
                dt_234.push(delta);
                transStart.pt234 = -1;
                transEnd.pt234 = -1;
                break;

            case "341":
                end = transEnd.pt341;
                start = transStart.pt341;
                delta = Math.abs(end - start); 
                statsTrans.totalTime_341 += delta;
                dt_341.push(delta);
                transStart.pt341 = -1;
                transEnd.pt341 = -1;
                break;
            
            case "412":
                end = transEnd.pt412;
                start = transStart.pt412;
                delta = Math.abs(end - start); 
                statsTrans.totalTime_412 += delta;
                dt_412.push(delta);
                transStart.pt412 = -1;
                transEnd.pt412 = -1;
                break;
        }

        style = "#00ee00";
        
        ctx.beginPath();
        ctx.strokeStyle = ctx.fillStyle = style;
        ctx.fillRect((xOff + start) * canvScale * wScale, yOff * canvScale, (end - (xOff + start)) * canvScale * wScale, (yEnd - yOff)*canvScale);
        ctx.closePath();

        
        if(delta > 15)
        {
            ctx.beginPath();
            ctx.font = "bold 13px Verdana";   
            ctx.fillStyle = style;
            ctx.fill();
            ctx.fillText(delta + " sec", start* canvScale * wScale,  yOff* canvScale);
            ctx.closePath();
        }
        return;
       
    }

    if(mode == "intrans")
    {
        switch(triad)
        {
            case "123":
                end = intraEnd.pt123;
                start = intraStart.pt123;
                delta = Math.abs(end - start); 
                statsIntrans.totalTime_123 += delta;
                di_123.push(delta);
                intraStart.pt123 = -1;
                intraEnd.pt123 = -1;
                break;

            case "234":
                end = intraEnd.pt234;
                start = intraStart.pt234;
                delta = Math.abs(end - start); 
                statsIntrans.totalTime_234 += delta;
                di_234.push(delta);
                intraStart.pt234 = -1;
                intraEnd.pt234 = -1;                
                break;

            case "341":
                end = intraEnd.pt341;
                start = intraStart.pt341;
                delta = Math.abs(end - start); 
                statsIntrans.totalTime_341 += delta;
                di_341.push(delta);        
                intraStart.pt341 = -1;
                intraEnd.pt341 = -1;        
                break;
            
            case "412":
                end = intraEnd.pt412;
                start = intraStart.pt412;
                delta = Math.abs(end - start); 
                statsIntrans.totalTime_412 += delta;
                di_412.push(delta);   
                intraStart.pt412 = -1;
                intraEnd.pt412 = -1;             
                break;
        }

        style = "#ee0000";

        ctx.beginPath();
        ctx.strokeStyle = ctx.fillStyle = style;
        ctx.fillRect((xOff + start)* canvScale * wScale, yOff* canvScale, (end - (xOff + start))* canvScale * wScale, (yEnd - yOff)* canvScale);         
        ctx.closePath();


        if(delta > 15)
        {
            ctx.font = "bold 13px Verdana";   
            ctx.fillStyle = style;
            ctx.fill();
            ctx.fillText(delta + " sec", start* canvScale * wScale, yOff* canvScale);
            ctx.closePath();
        }
        return;
    }
}

function initStats()
{
    statsTrans =
    {
        'totalTime_123': 0,
        'totalTime_234': 0,
        'totalTime_341': 0,
        'totalTime_412': 0
    };

    statsIntrans =
    {
        'totalTime_123': 0,
        'totalTime_234': 0,
        'totalTime_341': 0,
        'totalTime_412': 0
    };

    //Delta Trans/Delta Intrans arrays for statistics. Store the delta times of transitivity
    dt_123.length = 0; 
    di_123.length = 0;
    dt_234.length = 0;
    di_234.length = 0;
    dt_341.length = 0;
    di_341.length = 0;
    dt_412.length = 0;
    di_412.length = 0;

    timestamps.length = 0;
    observations.length = 0;

}

function fillInTable()
{
    $("#tri123-tr").text(parseFloat(statsTrans.totalTime_123).toFixed(2));
    $("#tri123-in").text(parseFloat(statsIntrans.totalTime_123).toFixed(2));
    $("#tri123-avgTr").text(parseFloat(averageArray(dt_123)).toFixed(2));
    $("#tri123-avgIn").text(parseFloat(averageArray(di_123)).toFixed(2));

    $("#tri234-tr").text(parseFloat(statsTrans.totalTime_234).toFixed(2));
    $("#tri234-in").text(parseFloat(statsIntrans.totalTime_234).toFixed(2));
    $("#tri234-avgTr").text(parseFloat(averageArray(dt_234)).toFixed(2));
    $("#tri234-avgIn").text(parseFloat(averageArray(di_234)).toFixed(2));

    $("#tri341-tr").text(parseFloat(statsTrans.totalTime_341).toFixed(2));
    $("#tri341-in").text(parseFloat(statsIntrans.totalTime_341).toFixed(2));
    $("#tri341-avgTr").text(parseFloat(averageArray(dt_341)).toFixed(2));
    $("#tri341-avgIn").text(parseFloat(averageArray(di_341)).toFixed(2));

    $("#tri412-tr").text(parseFloat(statsTrans.totalTime_412).toFixed(2));
    $("#tri412-in").text(parseFloat(statsIntrans.totalTime_412).toFixed(2));
    $("#tri412-avgTr").text(parseFloat(averageArray(dt_412)).toFixed(2));
    $("#tri412-avgIn").text(parseFloat(averageArray(di_412)).toFixed(2));
    
    initStats();
}

//Helper Functions
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


function averageArray(array)
{
    var sum = 0;
    array.forEach(function(element) {
        sum += element;
    }, this);

 
    
    if(array.length == 0)
        return 0;

    return sum / array.length;
}

function zeroArray(array)
{
   for(key in array) 
    {
        array[key] = 0;
    }
}


function clearEdgeList(triad)
{
            edgeList.one_two = edgeList.two_one = edgeList.two_three = edgeList.three_two = edgeList.three_one = edgeList.one_three = 0;
            edgeList.two_three = edgeList.three_two = edgeList.three_four = edgeList.four_three = edgeList.four_two = edgeList.two_four = 0
            edgeList.three_four = edgeList.four_three = edgeList.four_one = edgeList.one_four = edgeList.one_three = edgeList.three_one = 0
             edgeList.four_one = edgeList.one_four = edgeList.one_two = edgeList.two_one = edgeList.two_four = edgeList.four_two = 0;
             
             triad123 = [
                0, 0, 0, 0, 0, 0
            ];

            triad234 = [
                0, 0, 0, 0, 0, 0
            ];

            triad341 = [
                0, 0, 0, 0, 0, 0
                
            ];

            triad412 = [
                0, 0, 0, 0, 0, 0
            ];

}

function initPeriods()
{
    transStart.pt123 = -1;
    transStart.pt234 = -1;
    transStart.pt341 = -1;
    transStart.pt412 = -1;

    transEnd.pt123 = -1,
    transEnd.pt234 = -1,
    transEnd.pt341 = -1,
    transEnd.pt412 = -1,

    intraStart.pt123 = -1;
    intraStart.pt234 = -1;
    intraStart.pt341 = -1;
    intraStart.pt412 = -1;

    intraEnd.pt123 = -1;
    intraEnd.pt234 = -1;
    intraEnd.pt341 = -1;
    intraEnd.pt412 = -1;

}