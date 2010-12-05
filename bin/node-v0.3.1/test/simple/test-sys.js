common = require("../common");
assert = common.assert

assert.equal("0", common.inspect(0));
assert.equal("1", common.inspect(1));
assert.equal("false", common.inspect(false));
assert.equal("''", common.inspect(""));
assert.equal("'hello'", common.inspect("hello"));
assert.equal("[Function]", common.inspect(function() {}));
assert.equal('undefined', common.inspect(undefined));
assert.equal('null', common.inspect(null));
assert.equal('/foo(bar\\n)?/gi', common.inspect(/foo(bar\n)?/gi));
assert.equal('Sun, 14 Feb 2010 11:48:40 GMT',
        common.inspect(new Date("Sun, 14 Feb 2010 11:48:40 GMT")));

assert.equal("'\\n\\u0001'", common.inspect("\n\u0001"));

assert.equal('[]', common.inspect([]));
assert.equal('[]', common.inspect(Object.create([])));
assert.equal('[ 1, 2 ]', common.inspect([1, 2]));
assert.equal('[ 1, [ 2, 3 ] ]', common.inspect([1, [2, 3]]));

assert.equal('{}', common.inspect({}));
assert.equal('{ a: 1 }', common.inspect({a: 1}));
assert.equal('{ a: [Function] }', common.inspect({a: function() {}}));
assert.equal('{ a: 1, b: 2 }', common.inspect({a: 1, b: 2}));
assert.equal('{ a: {} }', common.inspect({'a': {}}));
assert.equal('{ a: { b: 2 } }', common.inspect({'a': {'b': 2}}));
assert.equal('{ a: { b: { c: [Object] } } }', common.inspect({'a': {'b': { 'c': { 'd': 2 }}}}));
assert.equal('{ a: { b: { c: { d: 2 } } } }', common.inspect({'a': {'b': { 'c': { 'd': 2 }}}}, false, null));
assert.equal('[ 1, 2, 3, [length]: 3 ]', common.inspect([1,2,3], true));
assert.equal('{ a: [Object] }', common.inspect({'a': {'b': { 'c': 2}}},false,0));
assert.equal('{ a: { b: [Object] } }', common.inspect({'a': {'b': { 'c': 2}}},false,1));
assert.equal("{ visible: 1 }",
  common.inspect(Object.create({}, {visible:{value:1,enumerable:true},hidden:{value:2}}))
);
assert.equal("{ [hidden]: 2, visible: 1 }",
  common.inspect(Object.create({}, {visible:{value:1,enumerable:true},hidden:{value:2}}), true)
);

// Objects without prototype
assert.equal(
  "{ [hidden]: 'secret', name: 'Tim' }",
  common.inspect(Object.create(null, {name: {value: "Tim", enumerable: true}, hidden: {value: "secret"}}), true)
);
assert.equal(
  "{ name: 'Tim' }",
  common.inspect(Object.create(null, {name: {value: "Tim", enumerable: true}, hidden: {value: "secret"}}))
);


// Dynamic properties
assert.equal(
  "{ readonly: [Getter] }",
  common.inspect({get readonly(){}})
);
assert.equal(
  "{ readwrite: [Getter/Setter] }",
  common.inspect({get readwrite(){},set readwrite(val){}})
);
assert.equal(
  "{ writeonly: [Setter] }",
  common.inspect({set writeonly(val){}})
);

var value = {};
value['a'] = value;
assert.equal('{ a: [Circular] }', common.inspect(value));
value = Object.create([]);
value.push(1);
assert.equal("[ 1, length: 1 ]", common.inspect(value));

// Array with dynamic properties
value = [1,2,3];
value.__defineGetter__('growingLength', function () { this.push(true); return this.length; });
assert.equal(
  "[ 1, 2, 3, growingLength: [Getter] ]",
  common.inspect(value)
);

// Function with properties
value = function () {};
value.aprop = 42;
assert.equal(
  "{ [Function] aprop: 42 }",
  common.inspect(value)
);

// Regular expressions with properties
value = /123/ig;
value.aprop = 42;
assert.equal(
  "{ /123/gi aprop: 42 }",
  common.inspect(value)
);

// Dates with properties
value = new Date("Sun, 14 Feb 2010 11:48:40 GMT");
value.aprop = 42;
assert.equal(
  "{ Sun, 14 Feb 2010 11:48:40 GMT aprop: 42 }",
  common.inspect(value)
);
