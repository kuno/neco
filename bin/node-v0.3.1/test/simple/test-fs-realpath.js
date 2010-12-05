common = require("../common");
assert = common.assert
var fs = require('fs');
var path = require('path');
var exec = require('child_process').exec;
var async_completed = 0, async_expected = 0, unlink = [];

function asynctest(testBlock, args, callback, assertBlock) {
  async_expected++;
  testBlock.apply(testBlock, args.concat(function(err){
    var ignoreError = false;
    if (assertBlock) {
      try {
        ignoreError = assertBlock.apply(assertBlock, arguments);
      }
      catch (e) {
        err = e;
      }
    }
    async_completed++;
    callback(ignoreError ? null : err);
  }));
}

function bashRealpath(path, callback) {
  exec("cd '"+path.replace("'","\\'")+"' && pwd -P",function 
  (err, o) {
    callback(err, o.trim());
  });
}

// sub-tests:

function test_simple_relative_symlink(callback) {
  console.log("test_simple_relative_symlink");
  var entry = common.fixturesDir+'/cycles/symlink',
      expected = common.fixturesDir+'/cycles/root.js';
  [
    [entry, 'root.js'],
  ].forEach(function(t) {
    try {fs.unlinkSync(t[0]);}catch(e){}
    fs.symlinkSync(t[1], t[0]);
    unlink.push(t[0]);
  });
  var result = fs.realpathSync(entry);
  assert.equal(result, expected,
      'got '+common.inspect(result)+' expected '+common.inspect(expected));
  asynctest(fs.realpath, [entry], callback, function(err, result){
    assert.equal(result, expected,
      'got '+common.inspect(result)+' expected '+common.inspect(expected));
  });
}

function test_simple_absolute_symlink(callback) {
  console.log("test_simple_absolute_symlink");
  bashRealpath(common.fixturesDir, function(err, fixturesAbsDir) {
    if (err) return callback(err);
    var entry = fixturesAbsDir+'/cycles/symlink',
        expected = fixturesAbsDir+'/nested-index/one/index.js';
    [
      [entry, expected],
    ].forEach(function(t) {
      try {fs.unlinkSync(t[0]);}catch(e){}
      fs.symlinkSync(t[1], t[0]);
      unlink.push(t[0]);
    });
    var result = fs.realpathSync(entry);
    assert.equal(result, expected,
        'got '+common.inspect(result)+' expected '+common.inspect(expected));
    asynctest(fs.realpath, [entry], callback, function(err, result){
      assert.equal(result, expected,
        'got '+common.inspect(result)+' expected '+common.inspect(expected));
    });
  });
}

function test_deep_relative_file_symlink(callback) {
  console.log("test_deep_relative_file_symlink");
  var expected = path.join(common.fixturesDir, 'cycles', 'root.js');
  var linkData1 = "../../cycles/root.js";
  var linkPath1 = path.join(common.fixturesDir, "nested-index", 'one', 'symlink1.js');
  try {fs.unlinkSync(linkPath1);}catch(e){}
  fs.symlinkSync(linkData1, linkPath1);

  var linkData2 = "../one/symlink1.js";
  var entry = path.join(common.fixturesDir, "nested-index", 'two', 'symlink1-b.js');
  try {fs.unlinkSync(entry);}catch(e){}
  fs.symlinkSync(linkData2, entry);
  unlink.push(linkPath1);
  unlink.push(entry);

  assert.equal(fs.realpathSync(entry), expected);
  asynctest(fs.realpath, [entry], callback, function(err, result){
    assert.equal(result, expected,
      'got '+common.inspect(result)+' expected '+common.inspect(expected));
  });
}

function test_deep_relative_dir_symlink(callback) {
  console.log("test_deep_relative_dir_symlink");
  var expected = path.join(common.fixturesDir, 'cycles', 'folder');
  var linkData1b = "../../cycles/folder";
  var linkPath1b = path.join(common.fixturesDir, "nested-index", 'one', 'symlink1-dir');
  try {fs.unlinkSync(linkPath1b);}catch(e){}
  fs.symlinkSync(linkData1b, linkPath1b);

  var linkData2b = "../one/symlink1-dir";
  var entry = path.join(common.fixturesDir, "nested-index", 'two', 'symlink12-dir');
  try {fs.unlinkSync(entry);}catch(e){}
  fs.symlinkSync(linkData2b, entry);
  unlink.push(linkPath1b);
  unlink.push(entry);

  assert.equal(fs.realpathSync(entry), expected);

  asynctest(fs.realpath, [entry], callback, function(err, result){
    assert.equal(result, expected,
      'got '+common.inspect(result)+' expected '+common.inspect(expected));
  });
}

function test_cyclic_link_protection(callback) {
  console.log("test_cyclic_link_protection");
  var entry = common.fixturesDir+'/cycles/realpath-3a';
  [
    [entry, '../cycles/realpath-3b'],
    [common.fixturesDir+'/cycles/realpath-3b', '../cycles/realpath-3c'],
    [common.fixturesDir+'/cycles/realpath-3c', '../cycles/realpath-3a'],
  ].forEach(function(t) {
    try {fs.unlinkSync(t[0]);}catch(e){}
    fs.symlinkSync(t[1], t[0]);
    unlink.push(t[0]);
  });
  assert.throws(function(){ fs.realpathSync(entry); });
  asynctest(fs.realpath, [entry], callback, function(err, result){
    assert.ok(err && true);
    return true;
  });
}

function test_cyclic_link_overprotection (callback) {
  console.log("test_cyclic_link_overprotection");
  var cycles = common.fixturesDir+'/cycles';
  var expected = fs.realpathSync(cycles);
  var folder = cycles+'/folder';
  var link = folder+'/cycles';
  var testPath = cycles;
  for (var i = 0; i < 10; i ++) testPath += '/folder/cycles';
  try {fs.unlinkSync(link)} catch (ex) {}
  fs.symlinkSync(cycles, link);
  assert.equal(fs.realpathSync(testPath), expected);
  asynctest(fs.realpath, [testPath], callback, function (er, res) {
    assert.equal(res, expected);
  });
}

function test_relative_input_cwd(callback) {
  console.log("test_relative_input_cwd");
  var p = common.fixturesDir.lastIndexOf('/');
  var entrydir = common.fixturesDir.substr(0, p);
  var entry = common.fixturesDir.substr(p+1)+'/cycles/realpath-3a';
  var expected = common.fixturesDir+'/cycles/root.js';
  [
    [entry, '../cycles/realpath-3b'],
    [common.fixturesDir+'/cycles/realpath-3b', '../cycles/realpath-3c'],
    [common.fixturesDir+'/cycles/realpath-3c', 'root.js'],
  ].forEach(function(t) {
    var fn = t[0];
    if (fn.charAt(0) !== '/') fn = entrydir + '/' + fn;
    try {fs.unlinkSync(fn);}catch(e){}
    fs.symlinkSync(t[1], fn);
    unlink.push(fn);
  });
  var origcwd = process.cwd();
  process.chdir(entrydir);
  assert.equal(fs.realpathSync(entry), expected);
  asynctest(fs.realpath, [entry], callback, function(err, result){
    process.chdir(origcwd);
    assert.equal(result, expected,
      'got '+common.inspect(result)+' expected '+common.inspect(expected));
    return true;
  });
}

function test_deep_symlink_mix(callback) {
  console.log("test_deep_symlink_mix");
  // todo: check to see that common.fixturesDir is not rooted in the
  //       same directory as our test symlink.
  // obtain our current realpath using bash (so we can test ourselves)
  bashRealpath(common.fixturesDir, function(err, fixturesAbsDir) {
    if (err) return callback(err);
    /*
    /tmp/node-test-realpath-f1 -> ../tmp/node-test-realpath-d1/foo
    /tmp/node-test-realpath-d1 -> ../node-test-realpath-d2
    /tmp/node-test-realpath-d2/foo -> ../node-test-realpath-f2
    /tmp/node-test-realpath-f2
      -> /node/test/fixtures/nested-index/one/realpath-c
    /node/test/fixtures/nested-index/one/realpath-c
      -> /node/test/fixtures/nested-index/two/realpath-c
    /node/test/fixtures/nested-index/two/realpath-c -> ../../cycles/root.js
    /node/test/fixtures/cycles/root.js (hard)
    */
    var entry = '/tmp/node-test-realpath-f1';
    try {fs.unlinkSync('/tmp/node-test-realpath-d2/foo');}catch(e){}
    try {fs.rmdirSync('/tmp/node-test-realpath-d2');}catch(e){}
    fs.mkdirSync('/tmp/node-test-realpath-d2', 0700);
    try {
      [
        [entry, '../tmp/node-test-realpath-d1/foo'],
        ['/tmp/node-test-realpath-d1', '../tmp/node-test-realpath-d2'],
        ['/tmp/node-test-realpath-d2/foo', '../node-test-realpath-f2'],
        ['/tmp/node-test-realpath-f2', fixturesAbsDir+'/nested-index/one/realpath-c'],
        [fixturesAbsDir+'/nested-index/one/realpath-c', fixturesAbsDir+'/nested-index/two/realpath-c'],
        [fixturesAbsDir+'/nested-index/two/realpath-c', '../../cycles/root.js'],
      ].forEach(function(t) {
        //common.debug('setting up '+t[0]+' -> '+t[1]);
        try {fs.unlinkSync(t[0]);}catch(e){}
        fs.symlinkSync(t[1], t[0]);
        unlink.push(t[0]);
      });
    } finally {
      unlink.push('/tmp/node-test-realpath-d2');
    }
    var expected = fixturesAbsDir+'/cycles/root.js';
    assert.equal(fs.realpathSync(entry), expected);
    asynctest(fs.realpath, [entry], callback, function(err, result){
      assert.equal(result, expected,
        'got '+common.inspect(result)+' expected '+common.inspect(expected));
      return true;
    });
  });
}

function test_non_symlinks(callback) {
  console.log("test_non_symlinks");
  bashRealpath(common.fixturesDir, function(err, fixturesAbsDir) {
    if (err) return callback(err);
    var p = fixturesAbsDir.lastIndexOf('/');
    var entrydir = fixturesAbsDir.substr(0, p);
    var entry = fixturesAbsDir.substr(p+1)+'/cycles/root.js';
    var expected = fixturesAbsDir+'/cycles/root.js';
    var origcwd = process.cwd();
    process.chdir(entrydir);
    assert.equal(fs.realpathSync(entry), expected);
    asynctest(fs.realpath, [entry], callback, function(err, result){
      process.chdir(origcwd);
      assert.equal(result, expected,
        'got '+common.inspect(result)+' expected '+common.inspect(expected));
      return true;
    });
  });
}

var upone = path.join(process.cwd(), "..");
function test_escape_cwd (cb) {
  console.log("test_escape_cwd");
  asynctest(fs.realpath, [".."], cb, function(er, uponeActual){
    assert.equal(upone, uponeActual,
      "realpath('..') expected: "+upone+" actual:"+uponeActual);
  })
}
var uponeActual = fs.realpathSync("..");
assert.equal(upone, uponeActual,
  "realpathSync('..') expected: "+upone+" actual:"+uponeActual);

// absolute symlinks with children.
// .
// `-- a/
//     |-- b/
//     |   `-- c/
//     |       `-- x.txt
//     `-- link -> /tmp/node-test-realpath-abs-kids/a/b/
// realpath(root+'/a/link/c/x.txt') ==> root+'/a/b/c/x.txt'
function test_abs_with_kids (cb) {
  console.log("test_abs_with_kids");
  bashRealpath(common.fixturesDir, function(err, fixturesAbsDir) {
    var root = fixturesAbsDir+'/node-test-realpath-abs-kids';
    function cleanup () {
      ;['/a/b/c/x.txt'
      , '/a/link'
      ].forEach(function (file) {
        try {fs.unlinkSync(root+file)} catch (ex) {}
      });
      ;['/a/b/c'
      , '/a/b'
      , '/a'
      , ''
      ].forEach(function (folder) {
        try {fs.rmdirSync(root+folder)} catch (ex) {}
      });
    }
    function setup () {
      cleanup()
      ;[''
      , '/a'
      , '/a/b'
      , '/a/b/c'
      ].forEach(function (folder) {
        console.log("mkdir "+root+folder)
        fs.mkdirSync(root+folder, 0700);
      });
      fs.writeFileSync(root+'/a/b/c/x.txt', 'foo');
      fs.symlinkSync(root+'/a/b', root+'/a/link');
    }
    setup();
    var linkPath = root+'/a/link/c/x.txt';
    var expectPath = root+'/a/b/c/x.txt';
    var actual = fs.realpathSync(linkPath);
    // console.log({link:linkPath,expect:expectPath,actual:actual},'sync');
    assert.equal(actual, expectPath);
    asynctest(fs.realpath, [linkPath], cb, function (er, actual) {
      // console.log({link:linkPath,expect:expectPath,actual:actual},'async');
      assert.equal(actual, expectPath);
      cleanup();
    });
  })
}

// ----------------------------------------------------------------------------

var tests = [
  test_simple_relative_symlink,
  test_simple_absolute_symlink,
  test_deep_relative_file_symlink,
  test_deep_relative_dir_symlink,
  test_cyclic_link_protection,
  test_cyclic_link_overprotection,
  test_relative_input_cwd,
  test_deep_symlink_mix,
  test_non_symlinks,
  test_escape_cwd,
  test_abs_with_kids
];
var numtests = tests.length;
function runNextTest(err) {
  if (err) throw err;
  var test = tests.shift()
  if (!test) console.log(numtests+' subtests completed OK for fs.realpath');
  else test(runNextTest);
}
runNextTest();


assert.equal('/', fs.realpathSync('/'));
fs.realpath('/', function (err, result) {
  assert.equal(null, err);
  assert.equal('/', result);
});



process.addListener("exit", function () {
  unlink.forEach(function(path){ try {fs.unlinkSync(path);}catch(e){} });
  assert.equal(async_completed, async_expected);
});
