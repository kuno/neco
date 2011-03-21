#!/usr/bin/env node

var filterConfig     = require('../../lib/config.js').filterConfig,
parseUserConfig      = require('../../lib/config.js').parseUserConfig,
parseGlobalConfig    = require('../../lib/config.js').parseGlobalConfig,
parseEcosystemConfig = require('../../lib/config.js').parseEcosystemConfig;

var envReady         = require('../../lib/inception.js').envReady,
toolReady            = require('../../lib/inception.js').toolReady,
rootReady            = require('../../lib/inception.js').rootReady,
configReady          = require('../../lib/inception.js').configReady,
recordReady          = require('../../lib/inception.js').recordReady,
upgradeReady         = require('../../lib/inception.js').upgradeReady;

var update           = require('../../lib/command/update.js');

process.neco = {};

parseGlobalConfig(function() {parseUserConfig(function() {
    envReady('update', function() {toolReady(function() { 
      rootReady(function() {configReady(function() {
        upgradeReady(function() {
          // Autumatic update
          update.auto();
        });
      });});
    });});
});});
  
