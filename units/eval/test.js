var parser = new app.EvalExpression({
	expression : '1',
	scope : {
		a : 121,
		b : 11,
		c : 10,
		d : 3,
		test : {
			items : [
				{name: 'Петя', id:20},
				{name: 'Вася', id:18},
				{name: 'Игорь', id:4}
			]
		},
		$_qwertyuiopasdfghjklzxcvbnm_0123456789QWERTYUIOPASDFGHJKLZXCVBNM : 123,
		_$_ : 11,
		__ : 22,
		_id : 10
		
	}
});

function equalString(a, b) {
	equal(parser.parse({
		expression: a
	}), b, a + '  :=  ' + b);
}

function equal2operand(a, cmd, b) {
	var   str = a + cmd + b
		, str2 = b + cmd + a
		, success = eval(str)
		, success2 = eval(str2)
	;
	
	equalString(str, success);
	equalString(str2, success2);
	
	equalString(a + ' ' + cmd + b, success);
	equalString(a + cmd + ' ' + b, success);
	equalString(a + ' ' + cmd + ' ' + b, success);
	
	equalString(b + ' ' + cmd + a, success2);
	equalString(b + cmd + ' ' + a, success2);
	equalString(b + ' ' + cmd + ' ' + a, success2);
}

function equal3operand(a, b, c) {
	var opers = [
		['+', '-'],
		['-', '+'],
		['*', '+'],
		['*', '-'],
		['*', '/'],
		['*', '*'],
		['/', '+'],
		['/', '-'],
		['%', '-'],
		['%', '+']
	];
	
	opers.forEach(function(cmd, i) {
			var cmd1 = cmd[0], cmd2 = cmd[1];
			
			var strs = [
				a + cmd1 + b + cmd2 + c,
				c + cmd1 + b + cmd2 + a,
				a + cmd1 + c + cmd2 + b,
				b + cmd1 + c + cmd2 + a
			];
		
		strs.forEach(function(str) {
			var success = eval(str);
			equalString(str, success);
		});
	});
}

function rnd(a) {
	return parseInt(Math.random() * a)
}

QUnit.test("2 операнда", function() {
	
	equal2operand(404, '+', 2);
	equal2operand(404, '-', 2);
	equal2operand(404, '*', 2);
	equal2operand(404, '/', 2);
	equal2operand(404, '%', 2);
	
	equal2operand(100, '+', 5);
	equal2operand(100, '-', 5);
	equal2operand(100, '*', 5);
	equal2operand(100, '/', 5);
	equal2operand(100, '%', 5);
	
	var a = rnd(5)+1, b = rnd(5)+1
	equal2operand(a, '==', b);
	equal2operand(a, '!=', b);
	equal2operand(a, '===', b);
	equal2operand(a, '>', b);
	equal2operand(a, '<', b);
	equal2operand(a, '<=', b);
	equal2operand(a, '>=', b);
	
});

QUnit.test("3 операнда без проверки приоритета", function() {
	equal3operand(rnd(100)+1, rnd(100)+1, rnd(100)+1);
	equal3operand(rnd(100)+1, rnd(100)+1, rnd(100)+1);
})

QUnit.test("Считывание переменных", function() {
	var s = parser.scope;
	
	equalString('', '');
	equalString('$_qwertyuiopasdfghjklzxcvbnm_0123456789QWERTYUIOPASDFGHJKLZXCVBNM', s.$_qwertyuiopasdfghjklzxcvbnm_0123456789QWERTYUIOPASDFGHJKLZXCVBNM);
	equalString('a + b', s.a + s.b);
	equalString('a + c', s.a + s.c);
	equalString('d/5*100', 100*s.d/5);
	equalString('test.items[0/a].name', s.test.items[0/s.a].name);
	
	equalString("_id", 10);
	equalString("_$_", 11);
	equalString("__", 22);
});


QUnit.test("Функции", function() {
	var s = parser.scope;
	var a = rnd(10)+1, b = rnd(10)+1;
	
	equalString('min('+a+', '+b+')', Math.min(a, b));
	equalString('max('+a+', '+b+')', Math.max(a, b));
	equalString('pow('+a+', '+b+')', Math.pow(a, b));
	
	var singleFuncs = ['abs','cbrt','ceil','clz32','cos','cosh','exp','expm1','floor','fround','hypot','imul','log','log1p','log2','log10','round','sign','sin','sinh','sqrt','tan','tanh','trunc'];
	singleFuncs.forEach(function(name) {
		equalString(name + "(" + a + ")", Math[name].call(Math, a))
	});
	
	
	equalString('pow(2, 3) * 4 + min(5, '+a+')', 32 + Math.min(5, a));
	
	equalString( ' if('+a+' > 4, ">", "<=")', a > 4 ? ">" : "<=" );
	
	equalString("isset(x123)", false);
	s.x123 = true;
	equalString("isset(x123)", true);
	
	equalString(" roundby(100.1111, 2) ", 100.11);
	equalString(" roundby(100.1111, 3) ", 100.111);
	equalString(" roundby(100.1111, 4) ", 100.1111);
	equalString(" roundby(100.1111, 1) ", 100.1);
	equalString(" roundby(100.1111, 0) ", 100);
	
	
	equalString(" crop('предположим, что это большой текст', 16) ", 'предположим, ...');
	
	equalString('time()', +new Date());
	
	equalString('var_dump(1, 2)', '[1,2]');
	equalString('var_dump(1, 2,   3)', '[1,2,3]');
	equalString('var_dump("123")', '["123"]');
	equalString('var_dump(\'123\')', '[\"123\"]');
	equalString('var_dump(\'\\\'\')', '[\"\'\"]');
	equalString('var_dump(",,,", \',,,\', ",\\",")', '[",,,",",,,",",\\","]');
	
	equalString('min(  max(  min( 123, 22 ),  55  ),  66  ) * 2', 110)
});


QUnit.test("Унарные операторы", function() {
	equalString("!1", false);
	equalString("!2", false);
	equalString("!!2", true);
	equalString("!!0", false);
	equalString("+!!0", 0);
	equalString("+!!1", 1);
	
	equalString("10 - +2", 8);
	
	equalString(" !2 || !2 ", false);
	equalString(" !2 || !0 ", true);
	equalString(" !0 || !1 ", true);
	
	equalString(" +-+-!!!1 ", 0);
	equalString(" +-+-!!!0 ", 1);
	equalString(" -+-!!!0 ", 1);
	
	equalString(" -+-!!!0 * 88 + -3 - !8  || 9", 85);
	equalString("-+-!!!0*88+-3-!8||9", 85);
});


QUnit.test("Приоритет операций", function() {
	var s = parser.scope;
	
	equalString('2 + 2 * 2', 6);
	equalString('(2 + 2) * 2', 8);
	
	equalString('(a + b) * c', (s.a + s.b) * s.c);
	equalString('a + b * c', s.a + s.b * s.c);
	
	var priors = [
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
			], prior, bigPrior, str;
			
	var a = rnd(10)+1, b = rnd(10)+1, c = rnd(10)+1;
	for (var i=1, n=priors.length; i<n; i++) {
		prior = priors[i];
		bigPrior = priors[i-1];
		
		for (var cmd_ls in prior) {
			for (var cmd_bg in bigPrior) {
				str = a + cmd_ls + b + cmd_bg + c
				equalString( str, eval(str) );
			}
		}
	}
	
});

QUnit.test("Вольные тесты. Тесты с 'изюменкой', взятые из практики ", function() {
	var s = parser.scope;
	
	s.stages = [ 1, 2, 3 ]
	s.added = 1431673790;
	s.lang = {
				 '<span>Поиск</span><br>рецепта' : '<span>Find</span><br>recipes'
				, '<span>Поиск</span><br>игредиентов' : '<span>Find</span><br>ingredients'
				, '<span>Поиск</span><br>оборудования' : '<span>Find</span><br>equipments'
				};
	s.langs = {'en':true,'ru':false}
	
	equalString(" stages.length  ", 3);
	equalString(" print_date(added*1000) ", "15.05.2015");
	equalString("lang['\<\span>Поиск\<\/\span>\<\\u0062r>рецепта']", '<span>Find</span><br>recipes')
	
	s.lng = 'ru';
	equalString(" if(langs[lng], 'active', '')  ", '');
	s.lng = 'en';
	equalString(" if(langs[lng], 'active', '')  ", 'active');
	
	equalString(" isset(langs) && isset(vegat)  ", false);
	equalString(" vegat != undefined  ", false);
	s.vegat = 1;
	equalString(" vegat != undefined  ", true);
	
	equalString(" isset(langs) && isset(vegat)  ", true);
	
	equalString(" var_dump(')', '(', ')') ", '[")","(",")"]');
	
	equalString(" ' test\\'me '  ", ' test\'me ');
	equalString(" \" test\\\"me \"  ", ' test\"me ');
	
	equalString(" '\\u0000\\u0001'  ", '\u0000\u0001');

});