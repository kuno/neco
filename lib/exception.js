var color = require('ansi-color').set,
issues = require('../include/default.js').issues,
leftParentheses = color('[', 'yellow'),
rightParentheses = color(']:\n', 'yellow'),
errHead = leftParentheses+color('Neco Error', 'red+bold')+rightParentheses, errBody,
causeHead = leftParentheses+color('Cause', 'red+bold')+rightParentheses, causeBody,
sgtHead = leftParentheses+color('Suggestion', 'cyan')+rightParentheses, sgtBody; 

Error.prototype.log = function() {
  var self = this;
  var stack = self.stack;
  errBody = stack;
  sgtBody = 'Report all these information to ' + issues;

  console.log(errHead+errBody);
  console.log(sgtHead+sgtBody);
};
