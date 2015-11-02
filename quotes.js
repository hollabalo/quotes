var http = require('http');
var fs = require('fs');

var catCache = null;
var quoteCache = {};

var dir = "./resources/";
var cFile = dir + 'cat_' + getDate() + '.txt';

module.exports = {
	getCategories : function(callback) {
		if(catCache == null) {
			getCategoryContent(cFile, function(err) {
				if(!err) {
					buildCategoriesHTML(JSON.parse(catCache).contents, function(data) {
						callback(data);
					});
				}
				else {
					buildCategoriesHTML(err, function(data) {
						callback(data);
					});
				}
			});
		}
		else {
			buildCategoriesHTML(JSON.parse(catCache).contents, function(data) {
				callback(data);
			});
		}
	},
	getQuoteOfTheDay : function(category, callback) {
		var qFile = dir + category +'_' + getDate() + '.txt';
		if(!quoteCache[category]) {
			getQuoteContent(qFile, category, function(err){
				if(!err) {
					buildQuoteHTML(JSON.parse(quoteCache[category]), function(data) {
						callback(data);
					});
				}
				else {
					buildQuoteHTML(err, function(data) {
						callback(data);
					});
				}
			});
		}
		else {
			buildQuoteHTML(JSON.parse(quoteCache[category]), function(data) {
				callback(data);
			});
		}
	}
};

function getContent(path, callback) {
	var options = {
		hostname: 'api.theysaidso.com',
		port: 80,
		path: path,
		method: 'GET'
	};
	var str = '';
	
	var req = http.request(options, function(res) {
		res.on('data', function(d) {
			str += d.toString();
		});
		res.on('end', function() {
			callback(str);
		});
	});
	req.on('error', function(e) {
		console.error(e);
		callback("error");
	})
	req.end();
	
}

function buildCategoriesHTML(cat, callback) {
	var res = '';
	res += "<html><head><title>Quotes</title>";
	res += "<style type='text/css'>";
	res += "body {font-family: 'Segoe UI', Frutiger, 'Frutiger Linotype', 'Dejavu Sans', 'Helvetica Neue', Arial, sans-serif;}";
	res += "</style>";
	res += "</head><body>";
	res +="<h3>Categories</h3>";
	res += "<ul>";
	if(cat == "error") {
		res += "<li>Cannot fetch categories</li>";
	}
	else {
		for (var key in cat.categories) {
			res += "<li><a href='/quotes/today/" + key + "'>" + cat.categories[key] + "</a></li>";
		}
	}
	res +="</ul>";
	res += "<div class='home'><a href='/'>Go back</a></div>";
	res += "</body></html>";
	callback(res);
}

function buildQuoteHTML(quote, callback) {
	var res = '';
	res += "<html><head><title>QUOTE</title>";
	res += "<style type='text/css'>";
	res += "body {font-family: 'Segoe UI', Frutiger, 'Frutiger Linotype', 'Dejavu Sans', 'Helvetica Neue', Arial, sans-serif;}";
	res += "</style>";
	res += "</head><body>";
	res += "<h3>Quote</h3>";
	if(quote == "error") {
		res += "<em>Cannot get quote.</em>";
	}
	else {
		quote.contents.quotes.forEach(function(data) {
			res += "<em>" + data.quote + "</em><br/>";
			res += "<strong>" + data.author + "</strong>";
		});
	}
	res += "<div class='home'><a href='/'>Go back</a></div>";
	res += "</body></html>";
	callback(res);
}

function getCategoryContent(cFile, callback) {
	if (fs.existsSync(cFile)) {
		catCache = fs.readFileSync(cFile).toString();
		callback();
	}
	else {
		getContent("/qod/categories.json", function(data) {
			if(data == "error") {
				callback("error");
			}
			else {
				if(!JSON.parse(data).error) {
					fs.writeFileSync(cFile, data);
					catCache = data;
					callback();
				}
				else {
					callback("error");
				}
			}
		});
	}
}	 

function getQuoteContent(qFile, cat, callback) {
	if (fs.existsSync(qFile)) {
		quoteCache[cat] = fs.readFileSync(qFile).toString();
		callback();
	}
	else {
		var query = '';
		if(cat == "today") {
			query = "/qod.json";
		}
		else {
			query = "/qod.json?category=" + cat;
		}

		getContent(query, function(data) {
			if(data == "error") {
				callback("error");
			}
			else {
				if(!JSON.parse(data).error) {
					fs.writeFileSync(qFile, data);
					quoteCache[cat] = data;
					callback();
				}
				else {
					callback("error");
				}
			}
		});
	}
}

function getDate() {
	var currentDate = new Date();
    var day = currentDate.getDate();
    var month = currentDate.getMonth() + 1;
    var year = currentDate.getFullYear();
    return year + "." + month + "." + day;
}