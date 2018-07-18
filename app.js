const express = require('express')
const path = require('path')
var fs = require('fs');
const favicon = require('serve-favicon')
const bodyParser = require('body-parser')
const multer = require('multer')
const xss = require("xss");
const expressValidator=require('express-validator');
const custom =require('./public/js/custom.js');
var pdfjsLib = require('pdfjs-dist');

var storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './public/uploads/pdfs')
  },
  filename: (req, file, cb) => {
    cb(null, "PDFS-"+file.originalname.substring(0, file.originalname.lastIndexOf('.')) + '-' + Date.now()+(path.extname(file.originalname)).toLowerCase())
  }
});
var upload = multer({
  storage: storage,
  fileFilter: function (req, file, callback) {
    var ext = (path.extname(file.originalname)).toLowerCase();
    if(ext !== '.pdf') {
        return callback(new Error('Only pdf format files are allowed!'))
    }
    callback(null, true)
  },
  limits:{
      fileSize: 1024*1024
  }
});

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
const pdfPath = 'public/web/test.pdf';
const KEYWORDFILE_Path = 'public/uploads/keywords/keyword.csv';
const PDFDIR_Path = 'public/uploads/pdfs/';


app.get('/', function (req, res) {
  res.render('index');
});

app.get('/search/:page', function (req, res) {
  var page = req.params.page;
  console.log("now-- "+page);
  res.render('search');
});
app.get('/search', function (req, res) {
  res.render('search');
});

app.post('/search', function (req, res) {
  searchKey=req.body.searchKey;
  
var indices=[]
var numPages=0
msg={}
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
    msg.message="Keyword found in "+indices.length+" out of "+numPages+ " pages."
    msg.color="success";
    res.locals.message="Keyword found in "+indices.length+" out of "+numPages+ " pages.";
    res.locals.color="success";
  }
  else{msg.message="Keyword not found.";msg.color="danger";}
  console.log(JSON.stringify(msg));
}, function (err) {
  console.error('Error: ' + err);
});
///////////////////////////////////

  res.render('search',msg);
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
var dataArray =[];
var pdfArray =[];
app.get('/upload', function (req, res) {
  fs.readdir(PDFDIR_Path, (err, files) => {
    files.forEach(file => {
      pdfArray.push(file);
    });
  })
  fs.stat(KEYWORDFILE_Path, function (err) {
    if (err == null) {
        console.log('File exists');
        fs.readFile(KEYWORDFILE_Path,'utf8', function (err, fileData) {
            if (err) throw err;
            dataArray = fileData.split(',');
            console.log("ea-"+dataArray);            
        });
    }
    else {
        console.log('file not exist');  
    }
  });  
  res.render('upload',{keywords:dataArray,pdfFiles:pdfArray });
});

app.post('/upload', function(req, res, next){
  upload.single('userpdf')(req, res, function (err) {
    if (err) {
      console.log("upload err"+err);
      res.render('upload',{msg:err,color:"danger"});
      return;
    }
    else{
      if (req.file===undefined) {
        console.log("empty");
        res.render('upload',{msg:"Select a PDF file to upload.",color:"danger"});
      } 
      else{
        console.log("done");
        res.render('upload',{msg:"Upload Successful!",color:"success"});
      }
    }
  });
});

app.post('/addkeyword', function(req, res){
  req.checkBody('searchKey','Please enter a keyword').notEmpty();
  var err=req.validationErrors();
  if(err){
    console.log("empty keyword- ");
    res.render('upload',{kmsg:err[0].msg,kcolor:"danger"});
  }
  else{
    fs.stat(KEYWORDFILE_Path, function (err) {
      if (err == null) {
          console.log('File exists');
          fs.appendFile(KEYWORDFILE_Path,","+xss(req.body.searchKey), function (err) {
              if (err) throw err;
              console.log('appended to file!');
          });
      }
      else {
          console.log('New file');  
          fs.writeFile(KEYWORDFILE_Path, xss(req.body.searchKey), function (err) {
              if (err) throw err;
              console.log('new file saved');
          });
      }
    });
  }
});
  
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
