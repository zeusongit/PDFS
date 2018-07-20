const express=require('express');
const router=express.Router();
const bodyParser = require('body-parser')
const multer = require('multer')
var fs = require('fs');
const xss = require("xss");
const path = require('path')
const expressValidator=require('express-validator');
router.use(express.static(path.join(__dirname, 'public')))
router.use(expressValidator())
const custom =require('../public/js/custom.js');

var storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './public/uploads/pdfs')
  },
  filename: (req, file, cb) => {
    cb(null, "PDFS__"+file.originalname.substring(0, file.originalname.lastIndexOf('.')) + '__' + Date.now()+(path.extname(file.originalname)).toLowerCase())
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

router.use(bodyParser.json())
router.use(bodyParser.urlencoded({ extended: true }))

const KEYWORDFILE_Path = 'public/uploads/keywords/keyword.csv';
const PDFDIR_Path = 'public/uploads/pdfs/';

router.get('/', function (req, res) {
  var displaydata=custom.getData();
  res.render('upload',{keywords:displaydata[0],pdfFiles:displaydata[1],msg:"",color:"" });
});

router.post('/', function(req, res, next){
  var displaydata=custom.getData();
  upload.single('userpdf')(req, res, function (err) {
    if (err) {
      console.log("upload err"+err);
      res.render('upload',{keywords:displaydata[0],pdfFiles:displaydata[1],msg:err,color:"danger"});
      return;
    }
    else{
      if (req.file===undefined) {
        console.log("empty");
        res.render('upload',{keywords:displaydata[0],pdfFiles:displaydata[1],msg:"Select a PDF file to upload.",color:"danger"});
      } 
      else{
        console.log("done");
        displaydata=custom.getData();
        res.render('upload',{keywords:displaydata[0],pdfFiles:displaydata[1],msg:"Upload Successful!",color:"success"});
      }
    }
  });
});

router.post('/addkeyword', function(req, res){
  req.checkBody('searchKey','Please enter a keyword').notEmpty();
  var err=req.validationErrors();
  if(err){
    console.log("empty keyword- ");
    var displaydata=custom.getData();
    res.render('upload',{keywords:displaydata[0],pdfFiles:displaydata[1],kmsg:err[0].msg,kcolor:"danger"});
  }
  else{
    try{
        var comma=',';
        var displaydata=custom.getData();
        console.log('ap'+displaydata[0].length);
        if(!displaydata[0][0]){comma='';}
        fs.appendFileSync(KEYWORDFILE_Path,comma+xss(req.body.searchKey));
        console.log('appended to file!');
        displaydata=custom.getData();
      } catch(err) {
        console.log(err+'file not appended');  
      } 
    }
    res.render('upload',{keywords:displaydata[0],pdfFiles:displaydata[1],kmsg:"Keyword added!",kcolor:"success"});
});


router.get('/deletePdf/:index', function (req, res) {
  var index = req.params.index;
  console.log("pdelete-- "+index);
  var displaydata=custom.getData();
  var message="",color="";;
  try {
    var stats = fs.statSync(PDFDIR_Path);
    console.log('File exists');
    var pdfArr=displaydata[1];
    fs.unlinkSync(PDFDIR_Path+"/"+pdfArr[index]);
    displaydata[1].splice(index, 1);
    console.log("new-"+displaydata[1]);   
    message="PDF removed!";color="success" ;        
  }
  catch(err) {
    console.log(err+'file not exist');  
    message="PDF could not be removed!";color="danger" ;
  } 
  res.render('upload',{keywords:displaydata[0],pdfFiles:displaydata[1],msg:message,color:color});
});

router.get('/deleteKeyword/:index', function (req, res) {
  var index = req.params.index;
  console.log("kdelete-- "+index);
  var displaydata=custom.getData();
  var message="",color="";
  if (index > -1 && displaydata[0].length>0) {
    displaydata[0].splice(index, 1);
    try{
      if(displaydata[0].length===0){ fs.writeFileSync(KEYWORDFILE_Path,'');displaydata[0]=[];}
      else{
        for(var i=0;i<displaydata[0].length;i++){
          var keyArr=displaydata[0];
          if(i===0){
            fs.writeFileSync(KEYWORDFILE_Path,keyArr[i]);
          }
          else{
            fs.appendFileSync(KEYWORDFILE_Path,","+keyArr[i]);
          }        
          console.log('removed from file!');
          message="Keyword removed!"; color="success" ;       
        }
      }
    } catch(err) {
      console.log(err+'keyw not removed');  
      message="Keyword could not be removed!";color="danger" ;
    } 
  }
  console.log("len-"+displaydata[0].length); 
  res.render('upload',{keywords:displaydata[0],pdfFiles:displaydata[1],kmsg:message,kcolor:color});
});


module.exports=router;