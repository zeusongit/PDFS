const express = require('express');
const path=require('path');
const bodyParser=require('body-parser');
const app = express();
var Canvas = require('canvas-prebuilt');
var assert = require('assert');

var fs = require('fs');
var pdfjsLib = require('pdfjs-dist');
pdfjsLib.workerSrc ="build/pdf.worker.js";

app.set('view engine','ejs');
app.set('views',path.join(__dirname,'views'))
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static(path.join(__dirname,'public')));

app.get('/', function (req, res) {
// Relative path of the PDF file.
  var pdfURL = 'web/test.pdf';
  // Read the PDF file into a typed array so PDF.js can load it.
  var rawData = new Uint8Array(fs.readFileSync(pdfURL));
  // Load the PDF file.
  const source = {
    data: rawData,
    nativeImageDecoderSupport: 'none',
    disableFontFace: true
  } 
  pdfjsLib.getDocument(source).then(function (pdfDocument) {
      console.log('# PDF document loaded.'); 
      print(pdfDocument);
  });
  res.render('index');
});

function print(pdfDoc) {
  if (!pdfDoc || !pdfDoc.numPages) {
    return ;
  }

  var scale = 5;
  var iframe = window.document.createElement('iframe');
  var doc = iframe.contentDocument || iframe.contentWindow.document;

  window.document.body.append(iframe);

  doc.open();
  doc.write(
    '<!DOCTYPE html>' +
      '<html>' +
        '<head>' +
          '<style>' +
            '* {margin: 0 !important; padding: 0 !important}' +
            'div{width:612pt; height:792pt;}' +
            'canvas{width:100%; height:100%;}' +
        '</style>' +
      '</head>' +
      '<body></body>' +
    '</html>'
  );
  doc.close();

  function renderPage(num) {
    console.log('Rendering page %d of %d', num, pdfDoc.numPages);

    return pdfDoc
      .getPage(num)
      .then(function (page) {
        var div = doc.createElement('div');
        var canvas = doc.createElement('canvas');
        div.appendChild(canvas);
        doc.body.appendChild(div);
        var viewport = page.getViewport(scale);
        var ctx = canvas.getContext('2d');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        return page.render({canvasContext: ctx, viewport: viewport}).promise;
      })
      .then(function () {
        if (num < pdfDoc.numPages) {
          return renderPage(num + 1);
        }
      });
  }

  renderPage(1)
    .then(function () {
      iframe.contentWindow.print();
      iframe.remove();
    });
}

app.listen(3000, function () {
  console.log('Example app listening on port 3000!');
});