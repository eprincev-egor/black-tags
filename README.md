# Black-Tags template parser

## create object
var parser = new app.Templater({template: "some template..."});
var parsedHTML = parser.parse(scopeObject);

## expression
{  '"' + items[0].name + '"' }

## if expression
<if value=" a == 1 ">
	some html code...
</if>


## forEach
<each table='items' as='item' info='info'>
	<li class='item-{info.index}'>{item.name}</li>
</each>

## modules

<inc:menu params="items, 1"/>

<module name='menu' params='list, level'>
	<ul>
		<each table='list' as='item'>
			<li>
				{item.name}
				<if value='isset(item.items)'>
					<inc:menu params="item.items, level+1" />
				</if>
			</li>
		</each>
	</ul>
</module>