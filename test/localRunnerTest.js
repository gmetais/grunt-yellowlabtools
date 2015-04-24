/*jshint -W030 */

'use strict';

var chai          = require('chai');
var sinon           = require('sinon');
var sinonChai       = require("sinon-chai");

var LocalRunner     = require('../tasks/lib/localRunner');


var should = chai.should();
chai.use(sinonChai);

describe('localRunner', function() {

    var localRunner;
    var gruntMock;

    before(function() {
        gruntMock = {
            log: {
                writeln: sinon.spy()
            }
        };

        localRunner = new LocalRunner(gruntMock);
    });

    beforeEach(function() {
        gruntMock.log.writeln.reset();
    });


    it('should launch one run', function(done) {
        this.timeout(10000);

        var url = 'http://localhost:8388/simple-page.html';

        localRunner.launchRuns([url])
            .then(function(results) {

                results.should.be.an('array');
                results.should.have.length(1);

                results[0].should.have.a.property('params');
                results[0].should.have.a.property('toolsResults');
                results[0].should.have.a.property('rules');
                results[0].should.have.a.property('scoreProfiles');
                results[0].scoreProfiles.should.have.a.property('generic');
                results[0].scoreProfiles.generic.should.have.a.property('globalScore').that.is.at.least(90);

                gruntMock.log.writeln.should.have.been.calledTwice;
                gruntMock.log.writeln.firstCall.args[0].should.equal('Loading the page %s in PhantomJS... ');
                gruntMock.log.writeln.firstCall.args[1].should.equal(url);
                gruntMock.log.writeln.secondCall.args[0].should.equal(' [Global score is %d/100] (took %dms) ');
                gruntMock.log.writeln.secondCall.args[1].should.equal(100);
                gruntMock.log.writeln.secondCall.args[1].should.be.at.least(1);

                done();
            })
            .fail(function(err) {
                done(err);
            });

        //gruntMock.log.writeln.should.have.been.calledWith('Loading the page %s in PhantomJS...', url);
    });

    it('should launch multiple runs', function(done) {
        this.timeout(20000);

        var url = 'http://localhost:8388/simple-page.html';

        localRunner.launchRuns([url, url])
            .then(function(results) {

                results.should.be.an('array');
                results.should.have.length(2);

                results[0].should.have.a.property('scoreProfiles');
                results[1].should.have.a.property('scoreProfiles');

                done();
            })
            .fail(function(err) {
                done(err);
            });
    });

});