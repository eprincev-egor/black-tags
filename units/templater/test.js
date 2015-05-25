var 
	scope = {
		title : 'hello world',
		items : [
			{name:'name1',desc:'desc1', options:[{name:'Option 1'},{name:'Option 2'},{name:'Option 3'}]},
			{name:'name2',desc:'desc2'},
			{name:'name3',desc:'desc3'},
			{name:'name4',desc:'desc4'}
		],
		x : 2
	}
	, parser1 = new app.Templater({
		scope : scope
	})
;

function rnd(a) {
	return parseInt(Math.random() * a)
}

function eqtemplate(t1, t2, name) {
	var astr = parser1.set({template:t1}).parse();
	var bstr = _.template(t2)(scope);
	
	astr = astr.replace(/[\n\r\t]/g, '');
	bstr = bstr.replace(/[\n\r\t]/g, '');
	
	equal(astr, bstr, name)
};

QUnit.test("шаблоны", function() {
	var   $templates = $('.template')
		, $ts = $templates.filter('.t')
		, $us = $templates.filter('.u')
	;
	
	$ts.each(function(i) {
		var a = this.innerHTML, b = $us.get(i).innerHTML;
		
		eqtemplate(a, b, 'template #'+(i+1));
	})
});
