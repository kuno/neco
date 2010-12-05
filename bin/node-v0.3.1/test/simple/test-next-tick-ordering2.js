common = require("../common");
assert = common.assert

var order = [];
process.nextTick(function () {
  setTimeout(function() {
    order.push('setTimeout');
  }, 0);

  process.nextTick(function() {
    order.push('nextTick');
  });
})

process.addListener('exit', function () {
  assert.deepEqual(order, ['nextTick', 'setTimeout']);
});
