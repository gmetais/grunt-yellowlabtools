var async   = require('async');
var Q       = require('q');
var request = require('request');

var DistantRunner = function(grunt) {

    var POLL_INTERVAL = 5000; // milliseconds
    var MAX_POLL_TIME = 30; // minutes
    
    this.launchRuns = function(urls, options) {
        var deferred = Q.defer();

        var results = [];
        var currentUrl;

        async.whilst(function() {
            return urls.length > 0;
        }, function(callback) {
            
            currentUrl = urls.shift();

            var startTime = Date.now();
            grunt.log.writeln('Sending the run to the server ', currentUrl);
            


            requestRun(currentUrl, options)

            .then(function(runId) {
                var startTime = Date.now();
                return waitForCompletion(runId, options, startTime);
            })

            .then(function(runId) {
                grunt.log.writeln('Getting the results');
                return getResultsOnceComplete(runId, options);
            })

            .then(function(runResult) {
                var endTime = Date.now();
                var duration = Math.round((endTime - startTime) / 1000);

                var resultsUrl = options.serverUrl + '/result/' + runResult.runId;
                grunt.log.writeln(' [Global score is %d/100] (took %ds) - Details here: %s', runResult.scoreProfiles.generic.globalScore, duration, resultsUrl);
                results.push(runResult);
                callback();
            })

            .fail(callback);

        }, function(error) {
            if (error) {
                deferred.reject('YellowLabTools run failed on page ' + currentUrl + ' with error: ' + error);
            } else {
                deferred.resolve(results);
            }
        });

        return deferred.promise;
    };

    function requestRun(url, options) {
        var deferred = Q.defer();

        var yltOptions = {
            url: url,
            waitForResponse: false,
            screenshot: true,
            jsTimeline: true,
            device: options.device,
            //waitForSelector: options.waitForSelector,
            cookie: options.cookie,
            authUser: options.authUser,
            authPass: options.authPass
        };

        var reqOptions = {
            method: 'POST',
            json: true,
            followAllRedirects: true,
            uri: options.serverUrl + '/api/runs',
            body: yltOptions
        };

        // API Key option
        if (options.apiKey) {
            reqOptions.headers = {
                'x-api-key': options.apiKey
            };
        }

        request(reqOptions, function(error, response, body) {
            if (error) {
                deferred.reject(error);
            } else if (response.statusCode !== 200) {
                deferred.reject(response.statusCode + ' ' + response.body);
            }else {
                deferred.resolve(body.runId);
            }
        });

        return deferred.promise;
    }

    function waitForCompletion(runId, options, startTime) {
        var deferred = Q.defer();

        var lastStatus = null;
        var positionInQueue = -1;
        var error;

        promiseWhile(function() {

            // This is the "while" function. 
            // Return true if you want to go on.
            // Return false if you want to stop the loop.

            if (lastStatus === null) {
                // Skip test on first loop
                return true;
            }

            if (lastStatus.statusCode === 'complete') {
                return false;
            }

            if (lastStatus.statusCode === 'failed') {
                error = lastStatus.error;
                return false;
            }

            if (startTime + (MAX_POLL_TIME*60*1000) < Date.now()) {
                error = 'grunt-yellowlabtools timed-out after ' + MAX_POLL_TIME + ' minutes';
                return false;
            }

            if (lastStatus.statusCode === 'awaiting') {
                if (positionInQueue !== lastStatus.position) {
                    
                    if (lastStatus.position > 1) {
                        grunt.log.writeln('Waiting behind %d other tests', lastStatus.position);
                    } else {
                        grunt.log.writeln('Waiting behind 1 other test');
                    }
                    
                    positionInQueue = lastStatus.position;
                }
                return true;
            }

            if (lastStatus.statusCode === 'running') {
                if (positionInQueue !== 0) {
                    grunt.log.writeln('Test is running...');
                    positionInQueue = 0;
                }
                return true;
            }

        }, function() {

            return Q.delay(POLL_INTERVAL)

            .then(function() {
                return getRunStatus(runId, options);
            })

            .fail(function(err) {
                error = err;
                return Q(error);
            })

            .then(function(status) {
                lastStatus = status;
                return Q(status);
            });
        })

        .then(function() {
            if (error) {
                deferred.reject(error);
            } else {
                deferred.resolve(runId);
            }
        });

        return deferred.promise;
    }

    function getRunStatus(runId, options) {
        var deferred = Q.defer();

        var reqOptions = {
            method: 'GET',
            json: true,
            uri: options.serverUrl + '/api/runs/' + runId
        };

        // API Key option
        if (options.apiKey) {
            reqOptions.headers = {
                'x-api-key': options.apiKey
            };
        }

        request(reqOptions, function(error, response, body) {
            if (error) {
                grunt.log.error('Error while polling the run status');
                deferred.reject(error);
            } else if (response.statusCode !== 200) {
                grunt.log.error('Error while polling the run status');
                deferred.reject(response.statusCode + ' ' + response.body);
            }else {
                deferred.resolve(body.status);
            }
        });

        return deferred.promise;
    }

    function getResultsOnceComplete(runId, options) {
        var deferred = Q.defer();

        var reqOptions = {
            method: 'GET',
            json: true,
            uri: options.serverUrl + '/api/results/' + runId
        };

        // API Key option
        if (options.apiKey) {
            reqOptions.headers = {
                'x-api-key': options.apiKey
            };
        }

        request(reqOptions, function(error, response, body) {
            if (error) {
                deferred.reject(error);
            } else if (response.statusCode !== 200) {
                deferred.reject(response.statusCode + ' ' + response.body);
            }else {
                deferred.resolve(body);
            }
        });

        return deferred.promise;
    }


    // `condition` is a function that returns a boolean
    // `body` is a function that returns a promise
    // returns a promise for the completion of the loop
    function promiseWhile(condition, body) {
        var deferred = Q.defer();

        function loop() {
            // When the result of calling `condition` is no longer true, we are
            // done.
            if (!condition()) return deferred.resolve();
            // Use `when`, in case `body` does not return a promise.
            // When it completes loop again otherwise, if it fails, reject the
            // done promise
            Q.when(body(), loop, deferred.reject);
        }

        // Start running the loop in the next tick so that this function is
        // completely async. It would be unexpected if `body` was called
        // synchronously the first time.
        Q.nextTick(loop);

        // The promise
        return deferred.promise;
    }

};

module.exports = DistantRunner;