
if ( typeof require == 'function' && typeof window == 'undefined' ) {
	app = module.exports;
}

;(function() {
	'use strict';
	var UNDEFINED = {};// чтото вроде уникального идентификатора
	var cmdBy = {'+':1,'-':1,'*':1,'=':1,'!':1,'/':1,'%':1,'>':1,'<':1,'|':1,'&':1,'^':1};
	var priors = [// если объ¤вл¤ть массив здесь, то быстрее работает
				{'*' : 1,
				'/' : 1,
				'%' : 1},
				
				{'+' : 1,
				'-' : 1},
				
				{'<' : 1,
				'<=' : 1,
				'>' : 1,
				'>=' : 1,
				'==' : 1,
				'!=' : 1,
				'===' : 1,
				'!==' : 1},
				
				{'&' : 1,
				'^' : 1,
				'|' : 1},
				
				{'&&' : 1,
				'||' : 1}
			];
			
	function EvalExpression() {
		return this.init.apply(this, arguments)
	}
	
	var proto = EvalExpression.prototype;
	
	proto.init = function(params) {
		params = params || {};
		var that = this;
		
		that.initEvalFuncs(params.funcs);
		delete params.funcs;
		that.set(params);
		
		return that;
	};
	
	proto.initEvalFuncs = function(funcs) {
		var that = this;
		funcs = funcs || {};
		
		that.funcs = {};
		
		that.funcs['rnd'] = function(a, b) {
			if ( !b ) {b=a;a=0;}
			return Math.floor(Math.random() * (b - a + 1)) + a;
		}
		
		that.funcs['isset'] = function(a) {
			return +(a != undefined);
		}
		
		that.funcs['var_dump'] = function() {
			var arr = [];
			[].forEach.call(arguments, function(a) {
				arr.push(a);
			});
			
			return JSON.stringify(arr);
		}
		
		that.funcs['if'] = function(a, b, c) {
			return a ? b : c;
		}
		
		that.funcs['time'] = function() {
			return +new Date();
		}
		
		 that.funcs['print_date'] = function( timestamp ) {
		   var   date = new Date(timestamp)
			, month = date.getMonth() + 1
			, day = date.getDate()
			, year = date.getFullYear()
		   ;
		   
		   if ( month < 10 ) {
			month = '0' + month;
		   }
		   
		   if ( day < 10 ) {
			day = '0' + day;
		   }
		   
		   return day + '.' + month + '.' + year;
		}
		
		that.funcs['crop'] = function(text, maxLength) {
			text = typeof text === 'string' ? text : "";
			
			if ( text.length >= maxLength - 3 ) {
				text = text.slice(0, maxLength - 3) + '...';
			}
			
			return text;
		}
		
		that.funcs['br2n'] = function(str) {
			str = str || '';
			return str.replace(/<br[^>]*>/gi, '\n\r');
		}
		
		that.funcs['n2br'] = function(str) {
			str = str || '';
			return str
			.replace(/\n\r/g, '<br/>')
			.replace(/\n/g, '<br/>')
			.replace(/\r/g, '<br/>')
		}
		
		that.funcs['roundby'] = function(a, b) {
			b = b || 0;
			if ( typeof a != 'number' ) {
				return a;
			}
			return a.toFixed(b);
		}
		
		if ( ({}).toString.call(funcs).slice(8, -1) == 'Object' ) {
			for (var key in funcs) {
				if ( typeof funcs[key] == 'function' ) {console.log(key)
					that.funcs[key] = funcs[key];
				}
			}
		}
	};
	
	proto.set = function( param, value ) {
		if ( ({}).toString.call(param).slice(8, -1) == 'Object'  ) {
			for (var key in param) {
				this[key] = param[key];
			}
		} else {
			this[param] = value;
		}
		return this;
	};
	
	proto.parse = function(params) {
		if ( typeof params == 'object' ) {
			this.set(params);
		}
		
		return this.processExpression( this.expression ).value;
	};
	
	
	proto.processExpression = function( expression ) {
		if ( +expression == expression ) {
			return {value: +expression};
		}
		
		var   that = this
			, coach = new StringCoach(expression)
			, path
			, symb
			, x
			, args
			, expArr = []
		;

		while ( coach.isNotEnd() ) {
			
			symb = coach.str[coach.i];
			if ( symb === '' ) {this.i++;continue;}
			if ( !symb ) {
				break;
			}
			
			// встретили переменную или функцию
			if ( /[a-z\_\$]/i.test(symb) ) {
				x = coach.readWord();
				
				if ( coach.str[coach.i] == '(' ) {
				// функци¤
					args = coach.readBracketContent('(', ')');
					args = that.splitArgs(args);
					for (var i=0, n=args.length; i<n; i++) {
						args[i] = that.processExpression(args[i]).value;
					}
					
					x = that.runFunc(x, args);
					expArr.push({value:x});
				} else {
				// переменна¤
					path = that.readPath(coach);
					
					if ( !path ) {// путь не валидный
						expArr.push({value:undefined});
					} else {
						x = that.getValueByPath([x].concat(path));
						expArr.push({value:x});
					}
				}
			} else 
			
			if ( +symb == symb && symb != ' ' ) {
				// число
				x = coach.readNumber();
				expArr.push({value:x});
			} else
			
			if ( cmdBy[symb] ) { 
			// встретили оператор
				x = coach.readCMD();
				expArr.push({cmd:x});
			} else
			
			if ( symb == '(' ) {
				x = coach.readBracketContent('(', ')');
				x = that.processExpression(x);
				expArr.push({value:x.value});
			} else
				
			if ( symb == '"' || symb == "'" ) { // встретили кавычки
				x = coach.readQuotes(symb);
				expArr.push({value:x});
			} else {
				coach.i++;
			}
		}
		
		return that.mathExpressionArray(expArr);
	};

	proto.mathExpressionArray = function(expArr) {	
		var that = this, cmd, value, x, el,
			// приоритет операторов
			prior,
			i=0, m=expArr.length, y;
		
		// после того, как разобрали выражение и вытащили значени¤ переменных
		// выполн¤ем операторы
		
		// сначало унарные операторы
		if ( expArr[0].cmd ) {
			// самый первые унарные операторы
			
			for (var i=0; i<m; i++) {
				el = expArr[i];
				if ( !el.cmd ) {
					value = el.value;
					i--;
					break;
				}
			}
			y = i;
			for (;i>=0; i--) {
				el = expArr[i];
				value = that.runUnarCommand(el.cmd, value);
			}
			expArr.splice(0, y+2, {value:value});
			m -= (y+1);
			
			if ( m == 1 ) {
				return expArr[0]
			}
		}
		
		// остальные унарные
		for (var j=1; j<m; j++) {
			el = expArr[j];
			
			// ждем значение, слево от которого, 2 оператора
			if ( el.cmd || k < 2 || !expArr[j-1].cmd || !expArr[j-2].cmd ) {
				continue;
			}
			
			// выполн¤ем n-1 операторов
			value = el.value;
			for (var k=j-1; k>0; k--) {
				cmd = expArr[k].cmd;
				if ( !expArr[k-1].cmd ) {
					break;
				}
				value = that.runUnarCommand(cmd, value);
			}
			expArr.splice(k+1, j-k, {value:value});
			m -= (j-k-1);
		}
		
		if ( m == 1 ) {
			return expArr[0];
		}
		
		// бинарные
		for (var i=0, n=priors.length; i<n; i++) {
			prior = priors[i];
			
			for(var j=1; j<m-1; j++) {
				el = expArr[j];
				cmd = el.cmd;
				
				if ( !prior[cmd] ) {
					continue;
				}
				
				value = that.runCommandBy2arg(cmd, expArr[j-1].value, expArr[j+1].value);
				expArr.splice(j-1, 3, {value:value});
				m -= 2;
				j--;
			}
		}
		
		return expArr[0];
	};
	
	proto.runUnarCommand = function(cmd, a) {
		switch (cmd) {
			case "!" :
				return !a;
			case "+" :
				return +a;
			case "-" :
				return -a;
		}
	}
	
	proto.runCommandBy2arg = function(cmd, a, b) {
		
			switch (cmd) {
				case '<' :
					return a < b;
				case '>' :
					return a > b;
				case '>=' :
					return a >= b;
				case '<=' :
					return a <= b;
				case '==' :
					return a == b;
				case '===' :
					return a === b;
				case '!=' :
					return a != b;
				case '!==' :
					return a !== b;
				case '*' :
					return a * b;
				case '/' :
					return a / b;
				case '+' :
					return a + b;
				case '-' :
					return a - b;
				case '%' :
					return a % b;
				case '&' :
					return a & b;
				case '&&' :
					return a && b;
				case '|' :
					return a | b;
				case '||' :
					return a || b;
				case '^' :
					return a ^ b;
			}
		
	};
	
	proto.readPath = function(coach) {
		var that = this, path = [], str, x, symb;
		
		while ( coach.isNotEnd() ) {
			symb = coach.str[coach.i];
			
			if ( /[a-z\_\$]/i.test(symb) ) {
				path = path.concat( coach.readPath() );
			} else
			
			if ( symb == '[' ) {
				str = coach.readBracketContent('[',']');
				x = that.processExpression( str );
				
				if ( x.value == undefined ) {
					return undefined;
				}
				
				path.push(x.value);
			} else 
			if ( symb == '.' ) {
				
				symb = coach.nextSymb();
				if ( !/[a-z\_\$\[]/i.test(symb) ) {
					return undefined;
				}
				
			} else {
				break;
			}
		}
		
		return path;
	};
	
	proto.getValueByPath = function(path) {
		var out = this.scope,
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
	
	proto.runFunc = function(name, args) {
		var that = this;
		
		if ( !that.funcs ) {that.funcs={}}
		if ( typeof that.funcs[name] == 'function' ) {
			return that.funcs[name].apply(that, args);
		} else 
		if ( typeof Math[name] == 'function' ) {
			return Math[name].apply(Math, args);
		} else {
			console.error(name + ' is not a function', that);
		}
	};
	
	proto.splitArgs = function(str) {
		var   out = []
			, opened = 0
			, s
			, lastIndex = 0
			, q
		;
		
		for (var i=0, n=str.length; i<n; i++) {
			s = str[i];
			
			// если открыты ковычки и встретили \ 
			if ( q && s === '\\' ) {
				i++;
				continue;
			}
			
			// обрабатываем открытие и закрытие ковычек
			if ( s === '"' || s === "'" ) {
				if ( q === s ) {
					q = false;
				} else 
				if ( !q ) {
					q = s;
				}
				continue;
			}
			
			if ( q ) {
				continue;
			}
			
			if ( s === '(' ) {
				opened++;
				continue;
			}
			if ( s === ')' ) {
				opened--;
				continue;
			}
			
			if ( opened === 0 && s == ',' ) {
				out.push( str.slice(lastIndex, i) );
				lastIndex = i+1;
			}
		}
		
		out.push( str.slice(lastIndex, n) );
		
		return out;
	};
	
	app.EvalExpression = EvalExpression;

	function StringCoach() {
		return this.init.apply(this, arguments)
	}
	
	var proto = StringCoach.prototype;
	
	proto.init = function(str) {
		var that = this;
		
		that.str = str;
		that.n = str.length;
		that.i = 0;
		
		return that;
	};
	
	proto.isUTFCode = function(offset) {
		var i = offset >= 0 ? offset : this.i;
		
		if ( this.str[i] != '\\' ) {
			return false;
		}
		if ( this.str[i+1] != 'u' ) {
			return false;
		}
		
		if ( /[^\d]/.test(this.str.slice(i+2, i+6) ) ) {
			return false;
		}
		
		return true;
	};
	
	proto.readUTFCode = function(offset, returnMe) {
		var i = offset >= 0 ? offset : this.i
			, s
		;
		var code = this.str.slice(i+2, i+6);
		if ( !returnMe ) {
			this.i += 6;
		}
		try{
			s = eval("'\\u"+code+"'");
		}catch(e) {
			console.error(e);
		}
		return s;
	};
	
	proto.nextSymb = function() {
		return this.str[++this.i];
	};
	
	proto.readWord = function() {
		var i,str;
		
		str = this.str.slice(this.i)
		i = str.search(/[^\w\$]/);
		if ( i == -1 ) {
			this.i = this.n;
			return str;
		} else {
			this.i += i;
			return str.slice(0, i);
		}
	};
	
	proto.readPath = function() {
		var i,str;
		
		str = this.str.slice(this.i)
		i = str.search(/[^\w\.\$]/);
		if ( i == -1 ) {
			this.i = this.n;
			return str.split('.');
		} else {
			this.i += i;
			return str.slice(0, i).split('.');
		}
	};
	
	proto.readQuotes = function(q) {
	
		var subStr = '';
		this.i++;
		for (var n=this.n, str=this.str, s; this.i<n; this.i++) {
			s = str[this.i];
			
			if ( s == '\\' ) {
				
				if ( this.isUTFCode(this.i) ) {
					subStr += this.readUTFCode(this.i, true);
					this.i+=5;
				} else {
					this.i++;
					subStr += eval('"\\'+str[this.i]+'"');
				}
				
				continue;
			}
			
			if ( s == q ) {
				break;
			}
			
			subStr += s;
		}
		
		return subStr;
	};
	
	proto.readBracketContent = function(open, close) {
		
		var subStr = '',
			openIndex = 0,
			q = false; // ковычка
			
		for (var i=++this.i, n=this.n, str=this.str, s; this.i<n; this.i++) {
			s = str[this.i];
			
			// если открыты ковычки и встретили \ 
			if ( q && s === '\\' ) {
				this.i++;
				subStr += (s + str[this.i]);
				continue;
			}
			
			// обрабатываем открытие и закрытие ковычек
			if ( s === '"' || s === "'" ) {
				if ( q === s ) {
					q = false;
				} else {
					q = s;
				}
				subStr += s;
				continue;
			}
			
			if ( q ) {
				subStr += s;
				continue;
			}
			
			// скобка открылась
			if ( s === open ) {
				openIndex++;
			} else
			
			// скобка закрылась
			if ( s === close ) {
				if ( openIndex === 0 ) {
					this.i++;
					break;
				}
				openIndex--;
			}
			
			subStr += s;
		}
		
		return subStr;
	};
	
	proto.readNumber = function() {
		
		var intPart = '',
			floatPart = '',
			isFloatPart = false;
		
		for (var n=this.n, str=this.str, s; this.i<n; this.i++) {
			s = str[this.i];
			
			if ( +s == s && s != ' ' ) {
				if ( !isFloatPart ) {
					intPart += s;
				} else {
					floatPart += s;
				}
			} else
			
			if ( s == '.' ) {
				if ( isFloatPart ) {
					break;
				}
				
				isFloatPart = true;
			} else {
				break;
			}
			
		}
		
		return +(intPart + '.' + floatPart + '0');
	};
	
	proto.readCMD = function() {
		var   i = this.i
			, str = this.str
			, a = str[i]
			, b = str[i+1]
			, c = str[i+2];
			
		// readCMD вызываетс¤, когда найдена комманда, поэтому повторна¤ проверка ненужна
		/*
		if ( !a ) {
			return undefined;
		}
		*/
		
		// !==, ===
		if ( b == '=' && c == '=' && ( a == '=' || a == '!' ) ) {
			this.i+=3;
			return a + b + c;
		}
		
		// ==, &&, ||
		if ( 
			(a=='&'||a=='|'||a=='=') && a == b && c != '=' ||
			b == '=' && ( a == '<' || a == '>' )
		) {
			this.i+=2;
			return a + b;
		}
		
		// !, != 
		if ( a == '!' ) {
			if ( b != '=' ) {
				this.i++;
				return a;
			} else {
				this.i+=2;
				return '!=';
			}
		}
		
		// +, -, *, /, %, &, |, ^, <, >
		
		//if ( cmdBy[a] ) {
			this.i++;
			return a;
		//}
		
	};
	
	proto.isEnd = function() {
		return this.i >= this.n;
	};
	
	proto.isNotEnd = function() {
		return this.i < this.n;
	};
	
	app.StringCoach = StringCoach;
})();
