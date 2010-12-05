## Assert

This module is used for writing unit tests for your applications, you can
access it with `require('assert')`.

### assert.fail(actual, expected, message, operator)

Tests if `actual` is equal to `expected` using the operator provided.

### assert.ok(value, [message])

Tests if value is a `true` value, it is equivalent to `assert.equal(true, value, message);`

### assert.equal(actual, expected, [message])

Tests shallow, coercive equality with the equal comparison operator ( `==` ). 

### assert.notEqual(actual, expected, [message])

Tests shallow, coercive non-equality with the not equal comparison operator ( `!=` ).

### assert.deepEqual(actual, expected, [message])

Tests for deep equality.

### assert.notDeepEqual(actual, expected, [message])

Tests for any deep inequality. 

### assert.strictEqual(actual, expected, [message])

Tests strict equality, as determined by the strict equality operator ( `===` ) 

### assert.notStrictEqual(actual, expected, [message])

Tests strict non-equality, as determined by the strict not equal operator ( `!==` ) 

### assert.throws(block, [error], [message])

Expects `block` to throw an error.

### assert.doesNotThrow(block, [error], [message])

Expects `block` not to throw an error.

### assert.ifError(value)

Tests if value is not a false value, throws if it is a true value. Useful when testing the first argument, `error` in callbacks.
