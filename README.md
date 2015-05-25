# Black-Tags template parser

## create object
var parser = new app.Templater({template: "some template..."});
var parsedHTML = parser.parse(scopeObject);

## expression
{  '"' + items[0].name + '"' }

## if expression
&lt;if value=" a == 1 "&gt;
	some html code...
&lt;/if&gt;


## forEach
&lt;each table='items' as='item' info='info'&gt;
	&lt;li class='item-{info.index}'&gt;{item.name}&lt;/li&gt;
&lt;/each&gt;

## modules

&lt;inc:menu params="items, 1"/&gt;

&lt;module name='menu' params='list, level'&gt;
	&lt;ul&gt;
		&lt;each table='list' as='item'&gt;
			&lt;li&gt;
				{item.name}
				&lt;if value='isset(item.items)'&gt;
					&lt;inc:menu params="item.items, level+1" /&gt;
				&lt;/if&gt;
			&lt;/li&gt;
		&lt;/each&gt;
	&lt;/ul&gt;
&lt;/module&gt;