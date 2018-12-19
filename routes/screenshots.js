var express = require('express');
var router  = express.Router();
const fs    = require('fs')
const path  = require('path');

/* GET screenshot listing. */
router.get('/', function(req, res, next) {
    var dirpath = path.basename(__dirname);
    var parts = req.query.d;

    if(parts=='' || parts== undefined){
        dirpath = dirpath+'/../public/screen_shots';
        parts = 'public/screen_shots';
    } else if(parts != 'undefined' || parts != undefined){
        dirpath = dirpath+'/../'+parts;
    }

    function flatten(lists) {
      return lists.reduce((a, b) => a.concat(b), []);
    }

    function getDirectories(srcpath) {
      return fs.readdirSync(srcpath)
        .map(file => path.join(srcpath, file))
        .filter(path => fs.statSync(path));
        // .filter(path => fs.statSync(path).isDirectory());
    }

    function getDirectoriesRecursive(srcpath) {
      return [srcpath, ...flatten(getDirectories(srcpath).map(getDirectoriesRecursive))];
    }

    var dirs = getDirectories(dirpath);
    var ar = [];

    for(i in dirs){
        if(dirs[i]!='public/screen_shots/.gitignore'){
            ar.push(dirs[i]);
        }
    }

    res.render('screenshots', { title: 'Screenshots', dirs: ar, parts: parts+'/' });
});

module.exports = router;
