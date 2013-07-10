#!/usr/bin/env node
/*
Automatically grade files for the presence of specified HTML tags/attributes.
Uses commander.js and cheerio. Teaches command line application development
and basic DOM parsing.

References:

 + cheerio
   - https://github.com/MatthewMueller/cheerio
   - http://encosia.com/cheerio-faster-windows-friendly-alternative-jsdom/
   - http://maxogden.com/scraping-with-node.html

 + commander.js
   - https://github.com/visionmedia/commander.js
   - http://tjholowaychuk.com/post/9103188408/commander-js-nodejs-command-line-interfaces-made-easy

 + JSON
   - http://en.wikipedia.org/wiki/JSON
   - https://developer.mozilla.org/en-US/docs/JSON
   - https://developer.mozilla.org/en-US/docs/JSON#JSON_in_Firefox_2
*/

var fs = require('fs');
var program = require('commander');
var cheerio = require('cheerio');
var util = require('util');
var rest = require('restler');
var HTMLFILE_DEFAULT = "index.html";
var CHECKSFILE_DEFAULT = "checks.json";
var URL_DEFAULT = ""; //"http://pacific-atoll-8806.herokuapp.com"

var assertFileExists = function(infile) {
    var instr = infile.toString();
    if(!fs.existsSync(instr)) {
        console.log("%s does not exist. Exiting.", instr);
        process.exit(1); // http://nodejs.org/api/process.html#process_process_exit_code
    }
    return instr;
};

var assertURL = function() {
    // http://stackoverflow.com/questions/8667070/javascript-regular-expression-to-validate-url
    if( /((https?):\/\/)?(www\.)?[a-z0-9\-\.]{3,}\.[a-z]{3}$/.test(assertURL.arguments[0]) ) {
	return assertURL.arguments[0];
    } else {
	console.log("'%s' is not a valid http url", assertURL.arguments[0]);
	process.exit(1);
    }
};


var cheerioHtmlFile = function(htmlfile) {
    return cheerio.load(fs.readFileSync(htmlfile));
};

var loadChecks = function(checksfile) {
    return JSON.parse(fs.readFileSync(checksfile));
};

var checkHtmlFile = function(htmlfile, checksfile) {
    $ = cheerioHtmlFile(htmlfile);
    var checks = loadChecks(checksfile).sort();
    var out = {};
    for(var ii in checks) {
        var present = $(checks[ii]).length > 0;
        out[checks[ii]] = present;
    }
    return out;
};

var checkHtmlUrl = function(htmlurl, checksfile) {
    // asynchronous
    // called once everytime rest.get() complete
    // so assertURL cannot call rest.get() again

    //http://stackoverflow.com/questions/17559378/node-js-restler-result-get-not-complete-when-trying-to-return-result?lq=1
    //http://stackoverflow.com/questions/17564255/getting-http-response-using-restler-in-node-js?lq=1
    var result = rest.get(htmlurl).on('complete', function(htmldata) {
	$ = cheerio.load(htmldata);
	var checks = loadChecks(checksfile).sort();
	var out = {};
	var present = 1 > 0;
	for(var ii in checks) {
	    present = $(checks[ii]).length > 0;
	    out[checks[ii]] = present;
	}
	var outJson = JSON.stringify(out, null, 4);
	console.log(outJson);
    });
    //return result;
};


var clone = function(fn) {
    // Workaround for commander.js issue.
    // http://stackoverflow.com/a/6772648
    return fn.bind({});
};

if(require.main == module) {
    program
        .option('-u, --url <url>', 'url to check', clone(assertURL), URL_DEFAULT)
        .option('-f, --file <html_file>', 'Path to index.html', clone(assertFileExists), HTMLFILE_DEFAULT)
        .option('-c, --checks <check_file>', 'Path to checks.json', clone(assertFileExists), CHECKSFILE_DEFAULT)
        .parse(process.argv);
    if (program.url) {
	checkHtmlUrl(program.url, program.checks);
    } else if (program.file) {
	var checkJson = checkHtmlFile(program.file, program.checks);
	var outJson = JSON.stringify(checkJson, null, 4);
	console.log(outJson);
    }
} else {
    exports.checkHtmlFile = checkHtmlFile;
    exports.checkHtmlUrl  = checkHtmlUrl ;
}
