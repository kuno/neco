var d = require("./d");

var assert = require("assert");

var package = require("./package");

assert.equal("world", package.hello);

common.debug("load fixtures/b/c.js");

var string = "C";

exports.SomeClass = function() {

};

exports.C = function () {
  return string;
};

exports.D = function () {
  return d.D();
};

process.addListener("exit", function () {
  string = "C done";
  console.log("b/c.js exit");
});
