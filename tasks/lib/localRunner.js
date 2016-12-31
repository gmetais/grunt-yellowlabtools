var async   = require('async');
var Q       = require('q');

var LocalRunner = function(grunt) {
    
    this.launchRuns = function(urls, options) {
        var deferred = Q.defer();
        var ylt;

        // Test if the optional YellowLabTools module is installed
        try {
            ylt = require('yellowlabtools');
        } catch(error) {
            deferred.reject('The npm module "yellowlabtools" is required for local runs. Use "npm install" without the "--no-optional" flag.');
            return deferred.promise;
        }


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
                authPass: options.authPass,
                proxy: options.proxy,
                blockDomain: options.blockDomain,
                allowDomain: options.allowDomain,
                noExternals: options.noExternals
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