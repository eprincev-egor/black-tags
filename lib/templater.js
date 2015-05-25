if ( !window && typeof require == 'function' ) {
	var app = require('./eval');
}

;(function() {
	'use strict';
	
	var   specTags = {
			each : true,
			'if' : true
		}
		, isArray = function(a) {
			var _class = {}.toString.call(a).slice(8, -1);
			return _class === 'Array';
		}
	;
	
	function Templater() {
		return this.init.apply(this, arguments);
	}
	
	var F = function(){};
	F.prototype = app.EvalExpression.prototype;
	Templater.prototype = new F();
	
	var proto = Templater.prototype;
	
	proto.init = function(params) {
		params = params || {};
		
		this._scope = {};
		this.initEvalFuncs(params.funcs);
		return this.set(params);
	};
	
	proto.set = function(params) {
		params = params || {};
		var that = this;
		
		that.template = typeof params.template == 'string' ? params.template : that.template || "<div></div>";
		// если params.scope равен null, будет ошибка во время парсинга,
		// думаю извне надо следить за таким.
		that.scope = typeof params.scope == 'object' ? params.scope : that.scope || {};
		
		that.replaceBrackets();
		that.initModules();
		that.map = that.createMap(that.template);
		
		if ( params.modules ) {
			for (var key in params.modules) {
				that.modules[key] = params.modules[key];
			}
		}
		
		return that;
	};
	
	proto.parse = function(scope) {
		var that = this;
		if ( scope ) {
			that.scope = scope;
		}
		that._scope = {};
		return that.parseMap(that.map, that.template);
	};
	
	proto.parseMap = function(map, str) {
		var   that = this
			, result = ''
			, el
			, table
			, tmp
			, k = 0
		;
		
		for (var i=0, n=map.length; i<n; i++) {
			el = map[i];
			result += str.slice(k, el.i);
			k = el.l;
			
			switch (el.type) {
				case 0 : // {=...}
					tmp = that.getValueByPath(el.path);
					result += tmp;
					// ==
					break;
				case 1 : // {...}
					tmp = that.processExpression(el.exp).value;
					result += tmp;
					// ==
					break;
				case 2 : // <if value='...'>...</if>
					tmp = that.processExpression(el.exp).value;
					if ( tmp ) {
						if ( el.map ) {
							tmp = that.parseMap(el.map, el.content);
							result += tmp;
						} else {
							result += el.content;
						}
					}
					// ==
					break;
				case 3 : // <each table='%path%' as='' info=''>...</each>
					table = that.getValueByPath(el.table);
					if ( typeof el.map == 'object' ) {
						tmp = [];
						for (var j=0, m=table.length; j<m; j++) {
							that._scope[el.item] = table[j];
							that._scope[el.info] = {index:j};
							tmp = that.parseMap(el.map, el.content);
							result += tmp;
						}
					} else {
						for (var j=0, m=table.length; j<m; j++) {
							result += el.content;
						}
					}
					// ==
					break;
				case 4 : // <each table='%expression%' as='' info=''>...</each>
					table = that.processExpression(el.table).value;
					if ( typeof el.map == 'object' ) {
						tmp = [];
						for (var j=0, m=table.length; j<m; j++) {
							that._scope[el.item] = table[j];
							that._scope[el.info] = {index:j};
							tmp = that.parseMap(el.map, el.content);
							result += tmp;
						}
					} else {
						for (var j=0, m=table.length; j<m; j++) {
							result += el.content;
						}
					}
					// ==
					break;
				case 5 : // <inc:module .../>
					tmp = that.modules[el.module_name];
					if ( !tmp ) {
						continue;
					}
					
					for (var j=0, m=el.params.length; j<m; j++) {
						that._scope[tmp.params[j]] = that.processExpression(el.params[j]).value;
					}
					
					tmp = that.parseMap(tmp.map, tmp.content);
					result += tmp;
					
					break;
			}
		}
		
		result += str.slice(k);
		
		return result;
	};
	
	proto.replaceBrackets = function() {
		var   that = this
			, coach = new TemplateCoach(that.template)
			, s
			, i
		;
		
		while ( coach.isNotEnd() ) {
			s = coach.str[coach.i];
			
			if ( s == ' ' ) {
				coach.i++;
				continue;
			}
			
			if ( s == '{' ) {
				i = coach.i;
				
				s = coach.readBracketContent('{', '}');
				if ( /^[\w\$\.\s]+$/.test(s) ) {
					s = s.split(/\s/).join('');
					coach.replaceBy(i, coach.i, '{=' + s + '}');
				}
				continue;
			}
			
			coach.i++;
		};
		
		that.template = coach.str;
		
		return that;
	};
	
	proto.initModules = function() {
		var   that = this
			, coach = new app.TemplateCoach(that.template)
			, s
			, attrs
			, modules = {}
			, module
			, params
			, content
			, startIndex
		;
		that.modules = {};
		
		while (coach.isNotEnd()) {
			s = coach.str[coach.i];
			
			if ( s == ' ' ) {
				coach.i++;
				continue;
			}
			
			if ( s == '<' ) {
				startIndex = coach.i++;
				
				s = coach.readTagName();
				if ( s != 'module' ) {
					continue;
				}
				
				attrs = coach.readAttrs();
				content = coach.readTag(s)
				params = [];
				if ( attrs.params  ) {
					params = that.splitArgs(attrs.params);
				} else {
					params = [];
				}
				
				module = that.createModule(params, content);
				modules[attrs.name] = module;
				
				coach.remove(startIndex, coach.i);
				
				coach.i++;
				continue;
			}
			
			coach.i++;
		};
		
		that.template = coach.str;
		that.modules = modules;
		
		for (var name in modules) {
			modules[name].map = that.createMap(modules[name].content);
		}
		
		return that;
	};
	
	proto.setModule = function(name, data) {
		this.modules[name] = data;
		return this;
	};
	
	proto.getModule = function(name) {
		return this.modules[name];
	};
	
	proto.removeModule = function(name) {
		delete this.modules[name];
		return this;
	};
	
	proto.createModule = function(params, content) {
		var module = {};
		
		if ( !content ) {
			content = params;
			params = [];
		}
		
		for (var j=0,m=params.length; j<m; j++) {
			params[j] = params[j].replace(/^\s+|\s+$/g, '');
		}
		
		module.content = content;
		module.params = params;
		module.map = this.createMap(content);
		
		return module;
	};
	
	proto.createMap = function(template, options) {
		options = options || {};
		
		var   that = this
			, coach = new TemplateCoach(template)
			, map = []
			, s
			, el
			, attrs
			, module
		;
		
		while ( coach.isNotEnd() ) {
			s = coach.str[coach.i];
			
			if ( s == ' ' ) {
				coach.i++;
				continue;
			}
			
			if ( s == '{' ) {
				el = {i:coach.i};
				s = coach.readBracketContent('{', '}');
				el.l = coach.i;
				
				if ( s[0] == '=' ) {
					el.type = 0;
					el.path = s.slice(1).split('.');
				} else {
					el.type = 1;
					el.exp = s;
				}
				
				map.push(el);
				
				continue;
			}
			
			if ( s == '<' ) {
				coach.i++;
				if ( coach.str[coach.i] == '{') {
					continue;
				}
				
				s = coach.readTagName();
				if ( s == 'if' || s == 'each' ) {
					el = {i: coach.i - s.length - 1};
					attrs = coach.readSpecAttrs();
					
					if ( s == 'if' ) {
						el.exp = attrs.value;
						el.type = 2;
					} else {
						el.info = attrs.info || 'info';
						el.item = attrs.as || 'item';
						if ( /^[\w\$\.\s]+$/.test(attrs.table) ) {
							el.type = 3;
							el.table = attrs.table.replace(/\s/g, '').split('.');
						} else {
							el.type = 4;
							el.table = attrs.table;
						}
					}
					
					
					el.content = coach.readTag(s);
					el.l = coach.i;
					
					el.map = that.createMap(el.content);
					if ( !el.map.length ) {
						delete el.map;
					}
					map.push(el);
				} else 
				if ( /inc:[\w\-]+/.test(s) ) {
					s = s.split(':')[1];
					el = {i: coach.i - s.length - 5};
					el.module_name = s;
					
					attrs = coach.readAttrs();
					el.l = coach.i;
					
					if ( attrs.params ) {
						el.params = that.splitArgs( attrs.params );
					} else {
						el.params = [];
					}
					
					el.type = 5;
					
					map.push(el);
				}
				
				coach.i++;
				continue;
			}
			
			coach.i++;
		};
		
		return map;
	};
	
	proto.getValueByPath = function(path) {
		var out = this.scope,
			name;
		
		
		for (var i=0, n=path.length; i<n; i++) {
			if ( 
				({}).toString.call(out).slice(8, -1) != 'Object' &&
				({}).toString.call(out).slice(8, -1) != 'Array' 
			) {
				return this._getValueByPath(path);
			}
			
			name = path[i];
			out = out[name];
		}
		
		if ( out === undefined ) {
			return this._getValueByPath(path);
		} else {
			return out;
		}
	};
	
	proto._getValueByPath = function(path) {
		var out = this._scope,
			name;
		
		
		for (var i=0, n=path.length; i<n; i++) {
			if ( 
				({}).toString.call(out).slice(8, -1) != 'Object' &&
				({}).toString.call(out).slice(8, -1) != 'Array' 
			) {
				return undefined;
			}
			
			name = path[i];
			out = out[name];
		}
		
		return out;
	};
	
	app.Templater = Templater;
	
	// ===============================================
	// ===============================================
	// ===============================================
	// Каретка
	
	function TemplateCoach() {
		return this.init.apply(this, arguments);
	};
	
	var F = function(){};
	F.prototype = app.StringCoach.prototype;
	TemplateCoach.prototype = new F();
	
	var proto = TemplateCoach.prototype;

	proto.readSpecAttrs = function() {
	/*  только специальные аттрибуты: table, as, info, value */
		var attrs = {},
			s,
			key;
			
		for (; this.i<this.n; this.i++) {
			s = this.str[this.i];
			
			if ( s == ' ' ) {
				continue;
			} else
			
			if ( s == 't' || s == 'v' || s == 'a' || s == 'i' ) {
			//if ( /[a-z]/.test(s) ) {
				key = this.readWord();
				attrs[key] = undefined;
				this.skipSymb('=');
				attrs[key] = this.readQuotes(this.str[this.i]);
			} else
			
			if ( s === '>' ) {
				this.i++;
				break;
			}
			
		}
		
		return attrs;
	};
	
	proto.readAttrs = function() {
		var attrs = {},
			s,
			key;
			
		for (; this.i<this.n; this.i++) {
			s = this.str[this.i];
			
			if ( s == ' ' ) {
				continue;
			} else
			
			if ( /[\w\-]/.test(s) ) {
				key = this.readWord();
				attrs[key] = undefined;
				this.skipSymb('=');
				attrs[key] = this.readQuotes(this.str[this.i]);
			} else
			
			if ( s === '>' ) {
				this.i++;
				break;
			}
			
		}
		
		return attrs;
	};
	
	proto.skipSymb = function(symb) {
		var finded = false, s;
		for (; this.i<this.n; this.i++) {
			s = this.str[this.i];
			
			if ( s == ' ' ) {
				continue;
			} else
			
			if ( s == symb && !finded ) {
				finded = true;
			} else {
				break;
			}
		}
	}
	
	proto.readTag = function(tagName) {
		var content = "", s
			, opened = 0
			, word
			, isClose = false
			, charW
		;
		
		for (; this.i<this.n; this.i++) {
			s = this.str[this.i];
			
			if ( s == ' ' ) {
				content += s;
				continue;
			}
			
			if ( s == '"' || s == "'" ) {
				content += s;
				content += this.readQuotes(s);
				content += s;
				continue;
			}
			
			if ( s == '<' ) {
				this.i++;
				charW = this.str[this.i]
				if ( charW == '/' ) {
					this.i++;
					isClose = true;
				} else {
					isClose = false;
				}
				
				word = this.readTagName();
				this.i--;
				if ( tagName == word ) {
					if ( !isClose ) {
						opened++;
						content += ("<" + word);
					} else {
						if ( opened === 0 ) {
							this.i+=2;
							break;
						}
						opened--;
						content += ("</" + word);
					}
					continue;
				}
				
				content += "<";
				if ( isClose ) {
					content += "/";
				}
				content += word;
				continue;
			}
			
			content += s;
		}
		
		return content;
	};
	
	proto.remove = function(start, end) {
		var   left = this.str.slice(0, start)
			, right = this.str.slice(end)
		;
		
		this.str = left + right;
		this.n = this.str.length;
		this.i = Math.max( this.i - (end - start), 0 );
	};
	
	// вставляем текст перед текущим индексом
	proto.pasteBefore = function(str) {
		var   left = this.str.slice(0, this.i)
			, right = this.str.slice(this.i)
			, n = str.length
		;
		
		this.str = left + str + right;
		this.n += n;
		
		this.i += n;
	};
	
	proto.replaceBy = function(start, end, str) {
		var   left = this.str.slice(0, start)
			, right = this.str.slice(end)
			, diff = str.length - (end - start)
		;
		
		this.str = left + str + right;
		this.n += diff;
		this.i = Math.min(this.n, this.i + diff);
		this.i = Math.max(0, this.i);
	};
	
	proto.readSpecTagName = function() {
		var i=this.i,str;
		
		str = this.str.slice(i, i+2);
		if ( str == 'if' ) {this.i=i+2;return 'if';}
		str += this.str.slice(i, i+4);
		if ( str == 'each' ) {this.i=i+4;return 'each';}
		
		return this.readWord();
	};
	
	proto.readTagName = function() {
		var i,str;
		
		str = this.str.slice(this.i)
		i = str.search(/[^\w\:]/);
		if ( i == -1 ) {
			this.i = this.n;
			return str;
		} else {
			this.i += i;
			return str.slice(0, i);
		}
	};
	
	app.TemplateCoach = TemplateCoach;
})();

if ( !window && typeof require == 'function' ) {
	module.exports = app;
}