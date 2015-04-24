/*jshint -W030 */

'use strict';

var should          = require('chai').should();
var conditions      = require('../tasks/lib/conditions');


describe('conditions', function() {

    it('should parse global score condition', function(done) {
        conditions.parsePhraseConditions(['fail if at least one url has a global score < 80/100']).then(function(conditionsObject) {
            conditionsObject.atLeastOneUrl.globalScore.should.deep.equal({below: 80});
            done();
        });
    });

    it('should parse global score condition with lte', function(done) {
        conditions.parsePhraseConditions(['fail if at least one url has a global score <= 80/100']).then(function(conditionsObject) {
            conditionsObject.atLeastOneUrl.globalScore.should.deep.equal({below: 81});
            done();
        });
    });

    it('should parse global score condition (negative)', function(done) {
        conditions.parsePhraseConditions(['fail if at least one url has a global score < -10/100']).then(function(conditionsObject) {
            conditionsObject.atLeastOneUrl.globalScore.should.deep.equal({below: -10});
            done();
        });
    });

    it('should parse a rule score', function(done) {
        conditions.parsePhraseConditions(['fail if at least one url has a domElementsCount score < 60/100']).then(function(conditionsObject) {
            conditionsObject.atLeastOneUrl.ruleScores.should.deep.equal([{ruleName: 'domElementsCount', below: 60}]);
            done();
        });
    });

    it('should parse a rule score with "an" instead of "a"', function(done) {
        conditions.parsePhraseConditions(['fail if at least one url has an eventsBound score < 60/100']).then(function(conditionsObject) {
            conditionsObject.atLeastOneUrl.ruleScores.should.deep.equal([{ruleName: 'eventsBound', below: 60}]);
            done();
        });
    });

    it('should parse a rule score with lte', function(done) {
        conditions.parsePhraseConditions(['fail if at least one url has a domElementsCount score <= 60/100']).then(function(conditionsObject) {
            conditionsObject.atLeastOneUrl.ruleScores.should.deep.equal([{ruleName: 'domElementsCount', below: 61}]);
            done();
        });
    });

    it('should parse a rule score (negative)', function(done) {
        conditions.parsePhraseConditions(['fail if at least one url has an eventsBound score < -2/100']).then(function(conditionsObject) {
            conditionsObject.atLeastOneUrl.ruleScores.should.deep.equal([{ruleName: 'eventsBound', below: -2}]);
            done();
        });
    });

    it('should parse a rule value', function(done) {
        conditions.parsePhraseConditions(['fail if at least one url has a domElementsCount > 2000']).then(function(conditionsObject) {
            conditionsObject.atLeastOneUrl.ruleValues.should.deep.equal([{ruleName: 'domElementsCount', above: 2000}]);
            done();
        });
    });

    it('should parse a rule value with "an" instead if "a"', function(done) {
        conditions.parsePhraseConditions(['fail if at least one url has an eventsBound > 50']).then(function(conditionsObject) {
            conditionsObject.atLeastOneUrl.ruleValues.should.deep.equal([{ruleName: 'eventsBound', above: 50}]);
            done();
        });
    });

    it('should parse a rule value with gte', function(done) {
        conditions.parsePhraseConditions(['fail if at least one url has a domElementsCount >= 2000']).then(function(conditionsObject) {
            conditionsObject.atLeastOneUrl.ruleValues.should.deep.equal([{ruleName: 'domElementsCount', above: 1999}]);
            done();
        });
    });

    it('should parse an "any rule"', function(done) {
        conditions.parsePhraseConditions(['fail if at least one url has a rule score < 20/100']).then(function(conditionsObject) {
            try {
                conditionsObject.atLeastOneUrl.anyRule.should.equal(20);
                done();
            } catch(e) {
                done(e);
            }
        });
    });

    it('should parse an "any rule" with lte', function(done) {
        conditions.parsePhraseConditions(['fail if at least one url has a rule score <= 20/100']).then(function(conditionsObject) {
            conditionsObject.atLeastOneUrl.anyRule.should.equal(21);
            done();
        });
    });

    it('should parse an ignored rule', function(done) {
        conditions.parsePhraseConditions(['ignore domElementsCount']).then(function(conditionsObject) {
            conditionsObject.atLeastOneUrl.ignoredRules.should.deep.equal(['domElementsCount']);
            done();
        });
    });

    it('should fail parsing an unknown phrase', function(done) {
        conditions.parsePhraseConditions(['blablabla', 'ignore domElementsCount'])
            
            .then(function() {
                done('Should have failed');
            })
            
            .fail(function(error) {
                try {
                    error.should.equal('Failed to parse this failCondition: blablabla');
                    done();
                } catch(e) {
                    done(e);
                }
            });
    });

    it('should parse a complex case', function(done) {
        conditions.parsePhraseConditions([
            'fail if at least one url has a global score < 80/100',
            'fail if at least one url has a rule score < 50/100',
            'fail if at least one url has a DOMelementsCount score < 100/100',
            'fail if at least one url has a DOMelementMaxDepth score < 20/100',
            'ignore iframesCount',
            'fail if at least one url has a DOMelementsCount > 2000'
        ])

            .then(function(conditionsObject) {
                conditionsObject.atLeastOneUrl.should.deep.equal({
                    anyRule: 50,
                    globalScore: {
                        below: 80
                    },
                    ignoredRules: [
                        'iframesCount'
                    ],
                    ruleScores: [
                        {
                            below: 100,
                            ruleName: 'DOMelementsCount'
                        },
                        {
                            below: 20,
                            ruleName: 'DOMelementMaxDepth'
                        }
                    ],
                    ruleValues: [
                        {
                            above: 2000,
                            ruleName: 'DOMelementsCount'
                        }
                    ]
                });
                done();
            })

            .fail(function(error) {
                done(error);
            });
    });

    it('should parse an empty array', function(done) {
        conditions.parsePhraseConditions([]).then(function(conditionsObject) {
            try{
                conditionsObject.atLeastOneUrl.should.deep.equal({
                    ignoredRules: [],
                    ruleScores: [],
                    ruleValues: []
                });
                done();
            } catch(e) {
                done(e);
            }
        });
    });

    it('should parse an undefined array', function(done) {
        conditions.parsePhraseConditions(undefined).then(function(conditionsObject) {
            try{
                conditionsObject.atLeastOneUrl.should.deep.equal({
                    ignoredRules: [],
                    ruleScores: [],
                    ruleValues: []
                });
                done();
            } catch(e) {
                done(e);
            }
        });
    });

    it('should check the global score', function() {
        var result = {
            "scoreProfiles": {
                "generic": {
                    "globalScore": 37
                }
            }
        };
        
        var fails = conditions.checkOneResult(result, {globalScore: {below: 36}});
        fails.should.be.empty;

        fails = conditions.checkOneResult(result, {globalScore: {below: 37}});
        fails.should.be.empty;

        fails = conditions.checkOneResult(result, {globalScore: {below: 38}});
        fails.should.not.be.empty;
        fails[0].should.have.string('Failed');

        fails = conditions.checkOneResult(result, {globalScore: 38});
        fails.should.not.be.empty;
        fails[0].should.have.string('Configuration error');
    });

    it('should ignore a rule when checking', function() {
        var result1 = require('./fixtures/result1.json');

        var fails = conditions.checkOneResult(result1, {
            anyRule: 1,
            ignoredRules: [
                'DOMelementsCount',
                'DOMelementMaxDepth',
                'DOMqueriesWithoutResults',
                'eventsBound',
                'globalVariables',
                'cssDuplicatedProperties'
            ]
        });

        fails.should.not.be.empty;
        fails.should.have.length(13);
        fails.join('/').should.not.contain('DOMelementsCount');
    });

    it('should override correctly a rule when checking', function() {
        var result1 = require('./fixtures/result1.json');

        var fails = conditions.checkOneResult(result1, {
            anyRule: 1,
            ruleScores: [
                {
                    ruleName: 'cssCount',
                    below: 80
                }
            ]
        });

        fails.should.have.length(20);
        fails.join('/').should.contain('cssCount');
    });

    it('should override correctly a rule when a ruleValue is defined', function() {
        var result1 = require('./fixtures/result1.json');

        var fails = conditions.checkOneResult(result1, {
            anyRule: 1,
            ruleValues: [
                {
                    ruleName: 'DOMelementsCount',
                    above: 1000
                }
            ]
        });

        fails.should.have.length(19);
        fails.join('/').should.contain('value for rule "DOMelementsCount"');
        fails.join('/').should.not.contain('score for rule "DOMelementsCount"');
    });

    it('should override correctly a ruleScore when a ruleValue is defined', function() {
        var result1 = require('./fixtures/result1.json');

        var fails = conditions.checkOneResult(result1, {
            ruleScores: [
                {
                    ruleName: 'DOMelementsCount',
                    below: 80
                }
            ],
            ruleValues: [
                {
                    ruleName: 'DOMelementsCount',
                    above: 1000
                }
            ]
        });

        fails.should.have.length(1);
        fails.join('/').should.contain('value for rule "DOMelementsCount"');
        fails.join('/').should.not.contain('score for rule "DOMelementsCount"');
    });

    it('should calculate the average scores and values', function() {
        var result1 = require('./fixtures/result1.json');
        var result2 = require('./fixtures/result2.json');
        var expected = require('./fixtures/average.json');

        var average = conditions.getAverage([result1, result2]);

        average.should.deep.equal(expected);
    });

    it('should check the global score for an url', function() {
        var result1 = require('./fixtures/result1.json');

        var err = conditions.checkGlobalScore(result1, 101);
        err.should.equal('Configuration error: globalScore must be between 0 and 100. Found 101');

        err = conditions.checkGlobalScore(result1, undefined);
        err.should.equal('Configuration error: globalScore must be between 0 and 100. Found undefined');

        err = conditions.checkGlobalScore(result1, -10);
        err.should.equal('Configuration error: globalScore must be between 0 and 100. Found -10');

        err = conditions.checkGlobalScore(result1, 0);
        should.not.exist(err);

        err = conditions.checkGlobalScore(result1, 19);
        should.not.exist(err);

        err = conditions.checkGlobalScore(result1, 20);
        err.should.equal('Failed on [http://booking.com]: globalScore should not be below 20. Found 19');
    });

    it('should check the global score for the average', function() {
        var average = require('./fixtures/average.json');

        var err = conditions.checkGlobalScore(average, -10);
        err.should.equal('Configuration error: globalScore must be between 0 and 100. Found -10');

        err = conditions.checkGlobalScore(average, 37);
        should.not.exist(err);

        err = conditions.checkGlobalScore(average, 38);
        err.should.equal('Failed for average pages: globalScore should not be below 38. Found 37');
    });

    it('should check the ruleScore for an url', function() {
        var result1 = require('./fixtures/result1.json');

        var err = conditions.checkRuleScore(result1, 'iframesCount', 101);
        err.should.equal('Configuration error: score for rule "iframesCount" must be between 0 and 100. Found 101');

        err = conditions.checkRuleScore(result1, 'iframesCount', undefined);
        err.should.equal('Configuration error: score for rule "iframesCount" must be between 0 and 100. Found undefined');

        err = conditions.checkRuleScore(result1, 'iframesCount', -1);
        err.should.equal('Configuration error: score for rule "iframesCount" must be between 0 and 100. Found -1');

        err = conditions.checkRuleScore(result1, 'iframesCount', 0);
        should.not.exist(err);

        err = conditions.checkRuleScore(result1, 'iframesCount', 77);
        should.not.exist(err);

        err = conditions.checkRuleScore(result1, 'iframesCount', 78);
        err.should.equal('Failed on [http://booking.com]: score for rule "iframesCount" should not be below 78. Found 77');
    });

    it('should check the ruleScore for the average', function() {
        var average = require('./fixtures/average.json');

        var err = conditions.checkRuleScore(average, 'DOMelementsCount', 0);
        should.not.exist(err);

        err = conditions.checkRuleScore(average, 'DOMelementsCount', 18);
        should.not.exist(err);

        err = conditions.checkRuleScore(average, 'DOMelementsCount', 19);
        err.should.equal('Failed for average pages: score for rule "DOMelementsCount" should not be below 19. Found 18');
    });

    it('should fail if rule is not found when checking its score', function() {
        var result = {
            rules: {}
        };

        var err = conditions.checkRuleScore(result, 'DOMelementsCount', 50);
        err.should.equal('Configuration error: rule "DOMelementsCount" not found');
    });

    it('should check the ruleValue for an url', function() {
        var result1 = require('./fixtures/result1.json');

        var err = conditions.checkRuleValue(result1, 'iframesCount', 'below', undefined);
        err.should.equal('Configuration error: value for rule "iframesCount" must be a number. Found undefined');

        err = conditions.checkRuleValue(result1, 'iframesCount', 'foo', undefined);
        err.should.equal('Configuration error: ruleValue "iframesCount" needs a threshold value that is "below" or "above". Use one of these terms.');

        err = conditions.checkRuleValue(result1, 'iframesCount', 'below', 1);
        should.not.exist(err);

        err = conditions.checkRuleValue(result1, 'iframesCount', 'below', -10);
        should.not.exist(err);

        err = conditions.checkRuleValue(result1, 'iframesCount', 'below', 5);
        should.not.exist(err);

        err = conditions.checkRuleValue(result1, 'iframesCount', 'below', 6);
        err.should.equal('Failed on [http://booking.com]: value for rule "iframesCount" should not be below 6. Found 5');

        err = conditions.checkRuleValue(result1, 'iframesCount', 'below', 999999);
        err.should.equal('Failed on [http://booking.com]: value for rule "iframesCount" should not be below 999999. Found 5');

        
        err = conditions.checkRuleValue(result1, 'iframesCount', 'above', 9999999);
        should.not.exist(err);

        err = conditions.checkRuleValue(result1, 'iframesCount', 'above', 5);
        should.not.exist(err);

        err = conditions.checkRuleValue(result1, 'iframesCount', 'above', 4);
        err.should.equal('Failed on [http://booking.com]: value for rule "iframesCount" should not be above 4. Found 5');

        err = conditions.checkRuleValue(result1, 'iframesCount', 'above', 0);
        err.should.equal('Failed on [http://booking.com]: value for rule "iframesCount" should not be above 0. Found 5');
    });

    it('should check the ruleValue for the average', function() {
        var average = require('./fixtures/average.json');

        var err = conditions.checkRuleValue(average, 'DOMelementsCount', 'above', 10000);
        should.not.exist(err);

        err = conditions.checkRuleValue(average, 'DOMelementsCount', 'above', 3107);
        should.not.exist(err);

        err = conditions.checkRuleValue(average, 'DOMelementsCount', 'above', 3106);
        err.should.equal('Failed for average pages: value for rule "DOMelementsCount" should not be above 3106. Found 3106.5');
    });

    it('should fail if rule is not found when checking its value', function() {
        var result = {
            rules: {}
        };

        var err = conditions.checkRuleValue(result, 'DOMelementsCount', 'above', 50);
        err.should.equal('Configuration error: rule "DOMelementsCount" not found');
    });

});