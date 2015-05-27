
var classes = require('./lib/templater.js');

// classes = {
//   StringCoach  -  ������� ������
	exports.StringCoach = classes.StringCoach;
//   EvalExpression  -  ��������� ���������
	exports.EvalExpression = classes.EvalExpression;
//   TemplateCoach -> StringCoach  -  ����������� ������ �������
	exports.TemplateCoach = classes.TemplateCoach;
//   Templater -> EvalExpression  -  ����������� ���������� ��������� �� �������������
	exports.Templater = classes.Templater;
// }

var fs = require('fs');

// ������� ���������� ��� �������, ������ �� ����� � ������� �������
var loadTemplates = function(folder, callback) {
	var  
		  modules = false // ������������� ������ ������� ��������,
						  // ��� ������ ������ ������������ ��������
	
		, pages = false // ������������� ������
						// ��� ���� ��� ��� ������� ��������
						// � �������: {
						//  template : ������-������
						//  info : ������, ��������� �� json �����
						//}
	;
	
	// ������������ �������� �������� � �������
	
	// �������
	loadPages(folder + '/pages', function(_pages) {
		pages = _pages;
		afterLoading();
	});
	
	// ������ ��� ��������
	loadModules(folder + '/modules', function(_modules) {
		modules = _modules;
		afterLoading();
	});
	
	// ����� �������� �����
	function afterLoading() {
		if ( !pages || !modules ) {
			// ���� ����� ��� �� ���������
			return;
		}
		
		for (var key in pages) {
			pages[key].parser.modules = modules;
		}
		
		if ( typeof callback != 'function' ) {
			return;
		}
		
		callback(pages);
	}
};

// ���������� ������� �� �����
function loadModules(folderPath, callback) {
	var modules = {};
	
	fs.readdir(folderPath, function(err, files) {
		var count = 0;
		
		files.forEach(function(fileName) {
			
			loadModule(folderPath + '/' + fileName, function(innerModules) {
				for (var key in innerModules) {
					modules[key] = innerModules[key];
				}
				
				count++;
				if ( count >= files.length && // ��������� ���-�� ���������� ������
				typeof callback == 'function' ) {
					callback(modules);
				}
			});
		});
	})
};

// ��������� ������, � ������(������� ���-����� ������) ��� ����������
function loadModule(filePath, callback) {
	
	fs.readFile(filePath, function(err, data) {
		if ( err ) throw err;
		
		data = data.toString();
		var parser = new classes.Templater({
			template : data
		});
		
		if ( typeof callback == 'function' ) {
			callback(parser.modules);
		}
	})
};

// ���������� ������� ������� �� �����
function loadPages(pagesPath, callback) {
	var pages = {};
	
	// ���������� ������� ������� ������ � �����������
	fs.readdir(pagesPath, function(err, files) {
		if (err) throw err;
		
		var count = 0; // ������ ��������
		files.forEach(function(fileName, index) {
			
			loadPage({
				
				template : pagesPath + '/' + fileName + '/' + fileName + '.html',
				info : pagesPath + '/' + fileName + '/' + fileName + '.json'
				
			}, function(page) {
				pages[fileName] = page;
				count++;
				
				if ( count >= files.length && // ��������� ���-�� ���������� �������
					typeof callback == 'function' 
				) {
					callback(pages);
				}
			})
		})
	})
};

// ��������� �� ����� ������ � ������� ������ �������
function loadPage(paths, callback) {
	var page = {};
	
	// ������ ���� �������
	fs.readFile(paths.template, function(err, template) {
		if (err) throw err;
		
		page.template = template.toString();
		page.parser = new classes.Templater({
			template : page.template
		});
		
		// ������ ���� ��������
		fs.readFile(paths.info, function(err, info) {
			if ( err ) {
				info = {}
			} else {
				info = JSON.parse(info.toString());
			}
			
			page.info = info;
			
			if ( typeof callback == 'function' ) {
				callback(page);
			}
		})
	})
};

exports.loadTemplates = loadTemplates;