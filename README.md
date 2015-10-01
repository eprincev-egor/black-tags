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
`html
<inc:menu params="items, 1"/>  <br/>

<module name='menu' params='list, level'>  <br/>
	<ul>  <br/>
		&<each table='list' as='item'>  <br/>
			<li>  <br/>
				{item.name}  <br/>
				<if value='isset(item.items)'>  <br/>
					<inc:menu params="item.items, level+1" />  <br/>
				</if>  <br/>
			</li>  <br/>
		</each>  <br/>
	</ul>  <br/>
</module>  <br/>
`
