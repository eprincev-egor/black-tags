# Black-Tags template parser

## create object
var parser = new app.Templater({template: "some template..."});
var parsedHTML = parser.parse(scopeObject);

## expression
{  '"' + items[0].name + '"' }

## if expression
&lt;if value=" a == 1 "&gt;  <br/>
	some html code...  <br/>
&lt;/if&gt;  <br/>


## forEach
&lt;each table='items' as='item' info='info'&gt;  <br/>
	&lt;li class='item-{info.index}'&gt;{item.name}&lt;/li&gt;  <br/>
&lt;/each&gt;  <br/>

## modules

&lt;inc:menu params="items, 1"/&gt;  <br/>

&lt;module name='menu' params='list, level'&gt;  <br/>
	&lt;ul&gt;  <br/>
		&lt;each table='list' as='item'&gt;  <br/>
			&lt;li&gt;  <br/>
				{item.name}  <br/>
				&lt;if value='isset(item.items)'&gt;  <br/>
					&lt;inc:menu params="item.items, level+1" /&gt;  <br/>
				&lt;/if&gt;  <br/>
			&lt;/li&gt;  <br/>
		&lt;/each&gt;  <br/>
	&lt;/ul&gt;  <br/>
&lt;/module&gt;  <br/>
