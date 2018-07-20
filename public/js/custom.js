module.exports = {
    getIndicesOf:function(searchStr, str, caseSensitive) {
        var searchStrLen = searchStr.length;
        if (searchStrLen == 0) {
            return [];
        }
        var startIndex = 0, index, indices = [];
        if (!caseSensitive) {
            str = str.toLowerCase();
            searchStr = searchStr.toLowerCase();
        }
        while ((index = str.indexOf(searchStr, startIndex)) > -1) {
            indices.push(index);
            startIndex = index + searchStrLen;
        }
        return indices;
    },
    getData:function(flag){
        const PDFDIR_Path = 'public/web/pdfs/';
        const KEYWORDFILE_Path = 'public/uploads/keywords/keyword.csv';
        var fs = require('fs');
        var dataArray =[];
        var pdfArray =[];
        var files = fs.readdirSync(PDFDIR_Path);
        console.log("f"+files);
        files.forEach(file => {
            if(!flag){
                var tmpArray = file.split('__');
                pdfArray.push(tmpArray[1]+".pdf");
            }
            else{pdfArray.push(file);}
        });
        try {
          var stats = fs.statSync(KEYWORDFILE_Path);
          console.log('File exists');
          var readf=fs.readFileSync(KEYWORDFILE_Path,'utf8');
          dataArray = readf.split(',');
          console.log("ea-"+dataArray);            
        }
        catch(err) {
          console.log(err+'file not exist');  
        } 
        return [dataArray,pdfArray];
      }
};