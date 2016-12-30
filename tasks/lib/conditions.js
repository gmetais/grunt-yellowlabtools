var Q       = require('q');
var printf  = require('util').format;



var checkFailConditions = function(results, conditions) {
    var deferred = Q.defer();
    var fails = [];

    // At least one URL: checking conditions on each result one by one
    if (conditions.atLeastOneUrl) {
        results.forEach(function(result) {
            fails = fails.concat(checkOneResult(result, conditions.atLeastOneUrl));
        });
    }

    deferred.resolve(fails);
    return deferred.promise;
};

var checkOneResult = function(result, conditionsObject) {
    var assertions = [];

    if (conditionsObject.globalScore) {
        assertions.push(checkGlobalScore(result, conditionsObject.globalScore.below));
    }

    for (var ruleName in result.rules) {
        // Look for a score rule with this ruleName
        var foundValueRule = findRuleValueByName(conditionsObject.ruleValues, ruleName);
        var foundScoreRule = findRuleScoreByName(conditionsObject.ruleScores, ruleName);

        if (foundValueRule) {
            if (foundValueRule.below) {
                assertions.push(checkRuleValue(result, ruleName, 'below', foundValueRule.below));
            } else if (foundValueRule.above) {
                assertions.push(checkRuleValue(result, ruleName, 'above', foundValueRule.above));
            }
        } else if (foundScoreRule) {
            assertions.push(checkRuleScore(result, ruleName, foundScoreRule.below));
        } else if (conditionsObject.anyRule && (!conditionsObject.ignoredRules || conditionsObject.ignoredRules.indexOf(ruleName) === -1)) {
            // There is an "any rule" and this particular rule isn't ignored
            assertions.push(checkRuleScore(result, ruleName, conditionsObject.anyRule));
        }
    }

    // Remove every undefined from the array before returning it
    return assertions.filter(function(assertion) {
        return assertion !== undefined;
    });
};

function findRuleValueByName(ruleValues, ruleName) {
    if (!ruleValues || ruleValues.length === 0) {
        return null;
    }

    var foundValueRule = null;

    ruleValues.forEach(function(ruleValue) {
        if (ruleValue.ruleName === ruleName && (ruleValue.above || ruleValue.below)) {
            foundValueRule = ruleValue;
        }
    });

    return foundValueRule;
}

function findRuleScoreByName(ruleScores, ruleName) {
    if (!ruleScores || ruleScores.length === 0) {
        return null;
    }

    var foundScoreRule = null;

    ruleScores.forEach(function(ruleScore) {
        if (ruleScore.ruleName === ruleName && ruleScore.below) {
            foundScoreRule = ruleScore;
        }
    });

    return foundScoreRule;
}

var checkGlobalScore = function(result, below) {
    if (below === undefined || below < 0 || below > 100) {
        return printf('Configuration error: globalScore must be between 0 and 100. Found %s', below);
    }

    var globalScore = result.scoreProfiles.generic.globalScore;

    if (globalScore < below) {
        if (result.params && result.params.url) {
            return printf('Failed on [%s]: globalScore should not be below %d. Found %d', result.params.url, below, globalScore);
        } else {
            return printf('Failed for average pages: globalScore should not be below %d. Found %d', below, globalScore);
        }
    }
};

var checkRuleScore = function(result, ruleName, below) {
    if (below === undefined || below < 0 || below > 100) {
        return printf('Configuration error: score for rule "%s" must be between 0 and 100. Found %s', ruleName, below);
    }

    var rule = result.rules[ruleName];

    if (rule === undefined) {
        return printf('Configuration error: rule "%s" not found', ruleName);
    }

    var ruleScore = rule.score;

    if (ruleScore < below) {
        if (result.params && result.params.url) {
            return printf('Failed on [%s]: score for rule "%s" should not be below %d. Found %d', result.params.url, ruleName, below, ruleScore);
        } else {
            return printf('Failed for average pages: score for rule "%s" should not be below %d. Found %d', ruleName, below, ruleScore);
        }
    }
};

var checkRuleValue = function(result, ruleName, belowOrAbove, threshold) {
    if (belowOrAbove !== 'below' && belowOrAbove !== 'above') {
        return printf('Configuration error: ruleValue "%s" needs a threshold value that is "below" or "above". Use one of these terms.', ruleName);
    }

    if (threshold === undefined) {
        return printf('Configuration error: value for rule "%s" must be a number. Found undefined', ruleName);
    }

    var rule = result.rules[ruleName];

    if (rule === undefined) {
        return printf('Configuration error: rule "%s" not found', ruleName);
    }

    var ruleValue = rule.value;

    if ((belowOrAbove === 'below' && ruleValue < threshold) || (belowOrAbove === 'above' && ruleValue > threshold)) {
        if (result.params && result.params.url) {
            return printf('Failed on [%s]: value for rule "%s" should not be %s %d. Found %d', result.params.url, ruleName, belowOrAbove, threshold, ruleValue);
        } else {
            return printf('Failed for average pages: value for rule "%s" should not be %s %d. Found %d', ruleName, belowOrAbove, threshold, ruleValue);
        }
    }
};


// Gets every score or value from all results and calculates their average
// NOT USED FOR THE MOMENT
var getAverage = function(results) {
    var globalScoreSum = 0;
    var globalScoreCount = 0;

    var rulesScoresSum = {};
    var rulesScoresCount = {};
    var rulesValuesSum = {};
    var rulesValuesCount = {};


    results.forEach(function(result) {
        
        // Global score
        globalScoreSum += result.scoreProfiles.generic.globalScore;
        globalScoreCount ++;

        // Rules
        for (var ruleName in result.rules) {
            if (!rulesScoresCount[ruleName]) {
                rulesScoresSum[ruleName] = 0;
                rulesScoresCount[ruleName] = 0;
                rulesValuesSum[ruleName] = 0;
                rulesValuesCount[ruleName] = 0;
            }

            rulesScoresSum[ruleName] += result.rules[ruleName].score;
            rulesScoresCount[ruleName] ++;
            rulesValuesSum[ruleName] += result.rules[ruleName].value;
            rulesValuesCount[ruleName] ++;
        }
    });

    // Calculate averages
    var averageObject = {
        scoreProfiles: {
            generic: {
                globalScore: globalScoreSum / globalScoreCount
            }
        },
        rules: {}
    };

    for (var ruleName in rulesScoresCount) {
        var score = rulesScoresSum[ruleName] / rulesScoresCount[ruleName];
        var value = rulesValuesSum[ruleName] / rulesValuesCount[ruleName];

        averageObject.rules[ruleName] = {
            score: score
        };

        if (!isNaN(value)) {
            averageObject.rules[ruleName].value = value;
        }
    }

    return averageObject;
};


// Reads an array of phrases, understand them and transform them into a conditionsObject
var parsePhraseConditions = function(phrasesArray) {
    var deferred = Q.defer();

    if (phrasesArray === undefined) {
        phrasesArray = [];
    }

    // Default conditionsObject
    var conditionsObject = {
        atLeastOneUrl: {
            ruleScores: [],
            ruleValues: [],
            ignoredRules: []
        }
    };

    // Parse each phrase
    var errorFound = phrasesArray.some(function(phrase) {
        
        // Test if phrase is about global score
        var globalScore = extractGlobalScore(phrase);
        
        // or about a rule score
        var ruleScore = extractRuleScore(phrase);
        
        // or about "any rule"
        var anyRule = extractAnyRule(phrase);
        
        // about ignoring a rule score
        var ignoreRule = extractIgnoreRule(phrase);
        
        // about a rule value
        var ruleValue = extractRuleValue(phrase);


        if (globalScore !== null) {
            conditionsObject.atLeastOneUrl.globalScore = globalScore;
        } else if (anyRule !== null) {
            conditionsObject.atLeastOneUrl.anyRule = anyRule;
        } else if (ruleScore !== null) {
            conditionsObject.atLeastOneUrl.ruleScores.push(ruleScore);
        } else if (ignoreRule !== null) {
            conditionsObject.atLeastOneUrl.ignoredRules.push(ignoreRule);
        } else if (ruleValue !== null) {
            conditionsObject.atLeastOneUrl.ruleValues.push(ruleValue);
        } else {
            deferred.reject('Failed to parse this failCondition: ' + phrase);
            return true;
        }
    });

    if (!errorFound) {
        deferred.resolve(conditionsObject);
    }

    return deferred.promise;
};

function extractGlobalScore(phrase) {
    var regex = /fail if at least one url has a global score (<=?) (-?\d+)\/100/;
    var result = regex.exec(phrase);

    if (!result) {
        return null;
    }

    if (result[1] === '<=') {
        return {below: parseInt(result[2], 10) + 1};
    } else if (result[1] === '<') {
        return {below: parseInt(result[2], 10)};
    }
}

function extractRuleScore(phrase) {
    var regex = /fail if at least one url has an? ([A-Za-z0-9]+) score (<=?) (-?\d+)\/100/;
    var result = regex.exec(phrase);

    if (!result) {
        return null;
    }

    if (result[2] === '<=') {
        return {
            ruleName: result[1],
            below: parseInt(result[3], 10) + 1
        };
    } else if (result[2] === '<') {
        return {
            ruleName: result[1],
            below: parseInt(result[3], 10)
        };
    }
}

function extractRuleValue(phrase) {
    var regex = /fail if at least one url has an? ([A-Za-z0-9]+) (>=?) (\d+)/;
    var result = regex.exec(phrase);

    if (!result) {
        return null;
    }

    if (result[2] === '>=') {
        return {
            ruleName: result[1],
            above: parseInt(result[3], 10) - 1
        };
    } else if (result[2] === '>') {
        return {
            ruleName: result[1],
            above: parseInt(result[3], 10)
        };
    }
}

function extractAnyRule(phrase) {
    var regex = /fail if at least one url has a rule score (<=?) (\d+)\/100/;
    var result = regex.exec(phrase);

    if (!result) {
        return null;
    }

    if (result[1] === '<=') {
        return parseInt(result[2], 10) + 1;
    } else if (result[1] === '<') {
        return parseInt(result[2], 10);
    }
}

function extractIgnoreRule(phrase) {
    var regex = /ignore ([A-Za-z0-9]+)/;
    var result = regex.exec(phrase);

    if (!result) {
        return null;
    }

    return result[1];
}


module.exports = {
    checkFailConditions: checkFailConditions,
    parsePhraseConditions: parsePhraseConditions,
    checkOneResult: checkOneResult,
    checkGlobalScore: checkGlobalScore,
    checkRuleScore: checkRuleScore,
    checkRuleValue: checkRuleValue,
    getAverage: getAverage
};
