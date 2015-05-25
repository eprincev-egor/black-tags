/*
	Возможно здесь когда-нибудь потребуется больше кода...
*/

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
