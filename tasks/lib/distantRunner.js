var async   = require('async');
var Q       = require('q');
var request = require('request');

var DistantRunner = function(grunt) {
    
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
            
            

            requestRunAndWaitForResponse(currentUrl, options)

            .then(function(runResult) {
                var endTime = Date.now();

                var resultsUrl = options.serverUrl + '/result/' + runResult.runId;
                grunt.log.writeln(' [Global score is %d/100] (took %dms) - Details here: %s', runResult.scoreProfiles.generic.globalScore, endTime - startTime, resultsUrl);
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

    function requestRunAndWaitForResponse(url, options) {
        var deferred = Q.defer();

        var yltOptions = {
            url: url,
            waitForResponse: true,
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
            uri: 'http://yellowlab.tools/api/runs',
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
                deferred.resolve(body);
            }
        });

        return deferred.promise;
    }

};

module.exports = DistantRunner;