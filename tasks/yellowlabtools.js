/*
 * grunt-yellowlabtools
 * https://github.com/gmetais/grunt-yellowlabtools
 *
 * Copyright (c) 2015 Gaël Métais
 * Licensed under the GPL license.
 */

'use strict';

var LocalRunner = require('./lib/localRunner');
var conditions = require('./lib/conditions');


module.exports = function(grunt) {

    grunt.registerMultiTask('yellowlabtools', 'Grunt plugin for YellowLabTools', function() {

        var failConditions = this.data.failConditions;
        var conditionsObject;
        var urls = this.data.urls;
        var urlsCount = urls.length;

        if (!urls || urlsCount === 0) {
            grunt.log.writeln('No given url');
            return;
        }

        var done = this.async();
        var localRunner = new LocalRunner(grunt);
        var options = this.options({
      
        });

        conditions.parsePhraseConditions(failConditions)

            .then(function(obj) {
                conditionsObject = obj;
                return localRunner.launchRuns(urls);
            })

            .then(function(results) {
                return conditions.checkFailConditions(results, conditionsObject);
            })

            .then(function(fails) {
                if (fails.length > 0) {
                    fails.forEach(function(fail) {
                        grunt.log.error(fail);
                    });
                    done(false);
                } else {
                    grunt.log.ok('%d urls tested', urlsCount);
                    done();
                }
            })

            .fail(function(error) {
                grunt.log.error(error);
                done(false);
            });
    });

    function printFailResults(fails) {
        if (fails.length > 0) {
            fails.forEach(function(fail) {
                grunt.log.error(fail);
            });
        } else {
            grunt.log.ok();
        }
    }

};
