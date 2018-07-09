const express = require('express');
const path=require('path');
const bodyParser=require('body-parser');
const app = express();
app.set('view engine','ejs');
app.set('views',path.join(__dirname,'views'))

//Body parser middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));

//static file path
app.use(express.static(path.join(__dirname,'public')));



app.get('/', function (req, res) {
  res.render('index');
});



var pdfjsLib = require('pdfjs-dist');

var pdfPath = './test.pdf';

// Setting worker path to worker bundle.
pdfjsLib.GlobalWorkerOptions.workerSrc =
  './pdf.worker.entry.js';

// Loading a document.
var loadingTask = pdfjsLib.getDocument(pdfPath);
loadingTask.promise.then(function (pdfDocument) {
  // Request a first page
  return pdfDocument.getPage(1).then(function (pdfPage) {
    // Display page on the existing canvas with 100% scale.
    var viewport = pdfPage.getViewport(1.0);
    var canvas = document.getElementById('theCanvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    var ctx = canvas.getContext('2d');
    var renderTask = pdfPage.render({
      canvasContext: ctx,
      viewport: viewport
    });
    return renderTask.promise;
  });
}).catch(function (reason) {
  console.error('Error: ' + reason);
});




app.listen(3000, function () {
  console.log('Example app listening on port 3000!');
});