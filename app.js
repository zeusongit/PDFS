const express = require('express');
const path=require('path');
const bodyParser=require('body-parser');
const app = express();
const fs = require('fs');

app.set('view engine','ejs');
app.set('views',path.join(__dirname,'views'))
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static(path.join(__dirname,'public')));

const custom =require('./public/js/custom.js');

var pdfjsLib = require('pdfjs-dist');
pdfjsLib.workerSrc ="public/build/pdf.worker.js";
var pdfPath = 'public/web/test.pdf';


app.get('/', function (req, res) {
  res.locals.page = 1;
  if(!app.locals.pages){
  app.locals.pages=[];
  }
  console.log(res.locals.page);
  res.render('index');
});

app.get('/:page', function (req, res) {
  var page = req.params.page;
  res.locals.page = page;
  console.log("-- "+res.locals.page);
  res.render('index');
});

app.post('/search', function (req, res) {
  res.locals.page = 1;
  searchKey=req.body.searchKey;
  
///////////////////////////////////
// Will be using promises to load document, pages and misc data instead of
// callback.
var indices=[]
pdfjsLib.getDocument(pdfPath).then(function (doc) {
  var numPages = doc.numPages;
  console.log('# Document Loaded');
  console.log('Number of Pages: ' + numPages);
  console.log();
  
  var lastPromise; // will be used to chain promises 
  lastPromise = doc.getMetadata().then(function (data) {
    console.log('# Metadata Is Loaded');
    console.log('## Info');
    console.log(JSON.stringify(data.info, null, 2));
    console.log();
    if (data.metadata) {
      console.log('## Metadata');
      console.log(JSON.stringify(data.metadata.getAll(), null, 2));
      console.log();
    }
  });

  var loadPage = function (pageNum) {
    return doc.getPage(pageNum).then(function (page) {
      console.log('# Page ' + pageNum);
      var viewport = page.getViewport(1.0 /* scale */);
      console.log('Size: ' + viewport.width + 'x' + viewport.height);
      console.log(" -- ");
      return page.getTextContent().then(function (content) {
        // Content contains lots of information about the text layout and
        // styles, but we need only strings at the moment
        var strings = content.items.map(function (item) {
          return item.str;
        });
        console.log('## Text Content');
        f_strings=strings.join('');
        console.log(f_strings);
        var temp=custom.getIndicesOf(searchKey,f_strings);
        if(!( temp === undefined || temp.length == 0 )) {
          indices.push(pageNum);
        }
        //console.log("i--"+indices);
      }).then(function () {
        console.log(" - ");
      });
    })
  };
  for (var i = 1; i <= numPages; i++) {
    lastPromise = lastPromise.then(loadPage.bind(null, i));
  }
  return lastPromise;
}).then(function () {
  console.log('# End of Document');
  console.log(indices);
  app.locals.pages=indices;
}, function (err) {
  console.error('Error: ' + err);
});
///////////////////////////////////
  res.render('index');
});

app.post('/ajax', function (req, res) {
  console.log("here");
  console.log("aj-"+req.body.data);
  res.contentType('json');
  res.send({ some: 'json' });
});

app.listen(3000, function () {
  console.log('PDFS app listening on port 3000!');
});