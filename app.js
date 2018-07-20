const express = require('express')
const path = require('path')
const favicon = require('serve-favicon')
const bodyParser = require('body-parser')
const expressValidator=require('express-validator');
const custom =require('./public/js/custom.js');
var pdfjsLib = require('pdfjs-dist');


var app = express()
app.set('port', process.env.PORT || 3000)
app.set('env', 'development')
app.set('views', path.join(__dirname, 'views'))
app.set('view engine','ejs')
app.use(favicon(path.join(__dirname, '/public/favicon.ico')))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(express.static(path.join(__dirname, 'public')))
app.use(expressValidator())
app.disable( 'x-powered-by' ) ;

pdfjsLib.workerSrc ="public/build/pdf.worker.js";
var pdfPath = 'public/web/pdfs/';

app.get('/', function (req, res) {
  res.render('index');
});

app.get('/search/:page', function (req, res) {
  var page = req.params.page;
  console.log("now-- "+page);
  res.render('search');
});
app.get('/search', function (req, res) {
  var displaydata=custom.getData();
  res.render('search',{keywords:displaydata[0],pdfFiles:displaydata[1],msg:"",color:""});
});

app.post('/search', function (req, res) {
  searchKey=req.body.searchKey;
  fileSelect=req.body.fileSelect;
  console.log(searchKey+" - "+fileSelect);
  req.checkBody('fileSelect','Please select a file').notEmpty();
  req.checkBody('searchKey','Please enter a keyword').notEmpty();
  var err=req.validationErrors();
  if(err){
    var displaydata=custom.getData();
    console.log("empty- "+err[0].msg);
    res.render('search',{keywords:displaydata[0],pdfFiles:displaydata[1],msg:err[0].msg,color:"danger"});
  }
  else{
  var message="",color="";
  var displaydata=custom.getData(1);
  pdfPath+=displaydata[1][fileSelect];
  console.log("pdfpath-"+pdfPath);
  var indices=[]
  var numPages=0
  pdfjsLib.getDocument(pdfPath).then(function (doc) {
  numPages = doc.numPages;
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
        //console.log('## Text Content');
        f_strings=strings.join('');
        //console.log(f_strings);
        var temp=custom.getIndicesOf(searchKey,f_strings);
        if(!( temp === undefined || temp.length == 0 )) {
          indices.push(pageNum);
        }
        console.log("i--"+indices);
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
  console.log(indices.length);
  if(indices.length>0){
    message="Keyword found in "+indices.length+" out of "+numPages+ " pages."
    color="success";
  }
  else{message="Keyword not found.";color="danger";}
}, function (err) {
  console.error('Error: ' + err);
});
///////////////////////////////////
console.log("m-"+message);
res.render('search',{keywords:displaydata[0],pdfFiles:displaydata[1],msg:message,color:color,pdfPath:pdfPath.replace('public/web/', '')});
}
});

app.post('/ajax', function (req, res) {
  var result = {};
  result.disable=false;
  indices=app.locals.pages;
  nxtPage=0;flag=false;
  endPage=0;
  if(req.body.action==="NEXT"){
    nxtPage=req.body.currPage+1;
    endPage=indices[indices.length-1];
    for(i=nxtPage;i<=endPage;i++)
    {
      console.log(i);
      if(indices.includes(i))
      {
        flag=true;
        result.pge=i;
        break;
      }
    }
  }
  else if(req.body.action==="PREV"){
    nxtPage=req.body.currPage-1;
    for(i=nxtPage;i>endPage;i--)
    {
      console.log(i);
      if(indices.includes(i))
      {
        flag=true;
        result.pge=i;
        break;
      }
    }
  }

  if(flag){result.disable=false;}else{result.disable=true;}
  console.log('body: ' + JSON.stringify(req.body));
  console.log('result: ' + JSON.stringify(result));
	res.send(result);
});


//Route Files
let upload=require('./routes/upload');
app.use('/upload',upload);
  
app.listen(app.get('port'), function () {
  console.log('Express server listening on port ' + app.get('port'))
})

app.use(function(req, res, next){
  res.status(404);
  if (req.accepts('html')) {
    res.render('404', { url: req.url });
    return;
  }
});
