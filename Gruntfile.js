/*
 * grunt-yellowlabtools
 * https://github.com/gmetais/grunt-yellowlabtools
 *
 * Copyright (c) 2014 Gaël Métais
 * Licensed under the GPL license.
 */

'use strict';

module.exports = function(grunt) {

    // Load all grunt modules
    require('matchdep').filterDev('grunt-*').forEach(grunt.loadNpmTasks);

    // Project configuration.
    grunt.initConfig({
        jshint: {
            all: [
                'Gruntfile.js',
                'tasks/**/*.js',
                'test/**/*.js'
            ],
            options: {
                node: true,
                mocha: true
            }
        },

        // Before generating any new files, remove any previously-created files.
        clean: {
            tests: ['tmp']
        },

        // Configuration to be run (and then tested).
        yellowlabtools: {
            twitter: {
                urls: [
                    'https://twitter.com',
                    'https://twitter.com/tos'
                ],
                failConditions: [
                    'fail if at least one url has a global score < 70/100'
                ]
            },
            github: {
                urls: [
                    'http://github.com/',
                    'https://github.com/features'
                ],
                failConditions: [
                    'fail if at least one url has a global score < 80/100',
                    'fail if at least one url has a rule score < 40/100',
                    'fail if at least one url has a cssOldPropertyPrefixes score < 90/100',
                    'fail if at least one url has a cssImportants score < 20/100',
                    'ignore jsErrors',
                    'fail if at least one url has a DOMelementsCount > 300'
                ]
            }
        },

        express: {
            testSuite: {
                options: {
                    port: 8388,
                    bases: 'test/www'
                }
            }
        },

        // Unit tests.
        mochaTest: {
            test: {
                options: {
                    reporter: 'spec',
                },
                src: ['test/*Test.js']
            }
        }

    });

    // Actually load this plugin's task(s).
    grunt.loadTasks('tasks');

    // Whenever the "test" task is run, first clean the "tmp" dir, then run this
    // plugin's task(s), then test the result.
    grunt.registerTask('test', [
        'jshint',
        'clean',
        'express:testSuite',
        'mochaTest'
    ]);

    // By default, lint and run all tests.
    grunt.registerTask('default', [
        'jshint',
        'test'
    ]);

};
