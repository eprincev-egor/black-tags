/*
	�������� ����� �����-������ ����������� ������ ����...
*/

var classes = require('./lib/templater.js');

// classes = {
//   StringCoach  -  ������� ������
	exports.StringCoach = classes.StringCoach;
//   EvalExpression  -  ��������� ���������
	exports.EvalExpression = classes.EvalExpression;
//   TemplateCoach -> StringCoach  -  ����������� ������ �������
	exports.TemplateCoach = classes.TemplateCoach;
//   Templater -> EvalExpression  -  ����������� ���������� ��������� �� �������������
	exports.Templater = classes.Templater;
// }
