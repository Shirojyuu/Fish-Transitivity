//This visuals script is used to display data to the canvas in the index.html file.
//The basic idea is using green and red circles to represent the transitivity of a relationship, plotting them over time.

var canvas;
var loader;


$(document).ready
{
    init();
}
function init()
{
    
    canvas = document.getElementById('dataWindow');   
    var context = canvas.getContext("2d");
    
    context.beginPath();
    context.arc(20, 20, 5, 0, 360);
    context.fillStyle = "blue";
    context.fill();
    console.log(canvas);
    
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
            console.log(csv);

        }
        reader.readAsDataURL(selectedFile);
    });
}