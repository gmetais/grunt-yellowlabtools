var async   = require('async');
var Q       = require('q');
var ylt     = require('yellowlabtools');

var LocalRunner = function(grunt) {
    
    this.launchRuns = function(urls, options) {
        var deferred = Q.defer();

        var results = [];
        var currentUrl;

        async.whilst(function() {
            return urls.length > 0;
        }, function(callback) {
            
            currentUrl = urls.shift();

            var yltOptions = {
                device: options.device,
                //waitForSelector: options.waitForSelector,
                cookie: options.cookie,
                authUser: options.authUser,
                authPass: options.authPass
            };

            var startTime = Date.now();
            grunt.log.writeln('Loading the page %s in PhantomJS... ', currentUrl);
            
            ylt(currentUrl, yltOptions)

            .then(function(runResult) {
                var endTime = Date.now();
                var duration = Math.round((endTime - startTime) / 1000);
                grunt.log.writeln(' [Global score is %d/100] (took %ds) ', runResult.scoreProfiles.generic.globalScore, duration);
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

};

module.exports = LocalRunner;