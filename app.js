const express = require('express');
const path=require('path');
const bodyParser=require('body-parser');

app.set('view engine','ejs');
app.set('views',path.join(__dirname,'views'))

//Body parser middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));

//static file path
app.use(express.static(path.join(__dirname,'public')));

const app = express();

app.get('/', function (req, res) {
  res.render('index');
});



var container = document.getElementById('viewerContainer');
var viewer = document.getElementById('viewer');


var pdfViewer = new PDFViewer({ 
   container: container,
   viewer: viewer
});

$scope.pdfFindController = new PDFFindController({
   pdfViewer: pdfViewer
});

pdfViewer.setFindController($scope.pdfFindController);

container.addEventListener('pagesinit', function () {
    pdfViewer.currentScaleValue = 'page-width';                            
});

PDFJS.getDocument(MY_PATH_TO_THE_PDF).then(function (pdfDocument) {
    pdfViewer.setDocument(pdfDocument);
});




app.listen(3000, function () {
  console.log('Example app listening on port 3000!');
});