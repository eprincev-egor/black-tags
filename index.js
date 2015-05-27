
var classes = require('./lib/templater.js');

// classes = {
//   StringCoach  -  картека строки
	exports.StringCoach = classes.StringCoach;
//   EvalExpression  -  обработка выражений
	exports.EvalExpression = classes.EvalExpression;
//   TemplateCoach -> StringCoach  -  расширенная версия каретки
	exports.TemplateCoach = classes.TemplateCoach;
//   Templater -> EvalExpression  -  Расширенный обработчик выражений до Шаблонизатора
	exports.Templater = classes.Templater;
// }

var fs = require('fs');

// функция подгружает все шаблоны, модули из папки и создает парсеры
var loadTemplates = function(folder, callback) {
	var  
		  modules = false // ассоциативный массив модулей шаблонов,
						  // где каждый модуль сгенерирован парсером
	
		, pages = false // ассоциативный массив
						// где ключ это имя шаблона страницы
						// а значние: {
						//  template : строка-шаблон
						//  info : объект, считанный из json файла
						//}
	;
	
	// параллельная загрузка шаблонов и модулей
	
	// шаблоны
	loadPages(folder + '/pages', function(_pages) {
		pages = _pages;
		afterLoading();
	});
	
	// модули для шаблонов
	loadModules(folder + '/modules', function(_modules) {
		modules = _modules;
		afterLoading();
	});
	
	// после загрузки обоих
	function afterLoading() {
		if ( !pages || !modules ) {
			// если чтото еще не загружено
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

// подгружаем модуели из папки
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
				if ( count >= files.length && // проверяем кол-во загруженых файлов
				typeof callback == 'function' ) {
					callback(modules);
				}
			});
		});
	})
};

// загружаем модуль, и парсим(создаем кэш-карту модуля) его содержимое
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

// подгружаем шаблоны страниц из папки
function loadPages(pagesPath, callback) {
	var pages = {};
	
	// подгружаем шаблоны страниц вместе с настройками
	fs.readdir(pagesPath, function(err, files) {
		if (err) throw err;
		
		var count = 0; // индекс страницы
		files.forEach(function(fileName, index) {
			
			loadPage({
				
				template : pagesPath + '/' + fileName + '/' + fileName + '.html',
				info : pagesPath + '/' + fileName + '/' + fileName + '.json'
				
			}, function(page) {
				pages[fileName] = page;
				count++;
				
				if ( count >= files.length && // проверяем кол-во загруженых страниц
					typeof callback == 'function' 
				) {
					callback(pages);
				}
			})
		})
	})
};

// загружаем из папки шаблон и создаем объект парсера
function loadPage(paths, callback) {
	var page = {};
	
	// читаем файл шаблона
	fs.readFile(paths.template, function(err, template) {
		if (err) throw err;
		
		page.template = template.toString();
		page.parser = new classes.Templater({
			template : page.template
		});
		
		// читаем файл настроек
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