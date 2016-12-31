# grunt-yellowlabtools

> Grunt plugin for YellowLabTools.

[YellowLabTools](http://yellowlab.tools) is an audit tool that loads a page in PhantomJS and detects front-end **bad practices** and **performance issues**.

Using audit tools is great, but you're going to use it once or twice, then forget about it! This Grunt plugin helps you add a **performance checking** step to your workflow.

1. Configure it once
2. Add it to your delivery process
3. Forget about it...
4. ...until the day something goes wrong and the task fails


I recommend using this grunt task if:
 - you're a developper and you're optimizing your code
 - you're a devOps and you want to block a release while the staging website is not perfect
 - you're a team and you're practicing continous integration


Unlike most of the similar tools ([grunt-pagespeed](https://github.com/jrcryer/grunt-pagespeed), [grunt-perfbudget](https://github.com/tkadlec/grunt-perfbudget), [grunt-pagespeedio](https://github.com/sitespeedio/grunt-sitespeedio)), grunt-yellowlabtools can run **locally** (default behavior), instead of calling a server you don't own. This is great for testing non-public pages!



## Getting Started
This plugin requires Grunt `~0.4.5`

If you haven't used [Grunt](http://gruntjs.com/) before, be sure to check out the [Getting Started](http://gruntjs.com/getting-started) guide, as it explains how to create a [Gruntfile](http://gruntjs.com/sample-gruntfile) as well as install and use Grunt plugins. Once you're familiar with that process, you may install this plugin with this command:

```shell
npm install grunt-yellowlabtools --save-dev
```

Once the plugin has been installed, it may be enabled inside your Gruntfile with this line of JavaScript:

```js
grunt.loadNpmTasks('grunt-yellowlabtools');
```

## The "yellowlabtools" task

### Overview
In your project's Gruntfile, add a section named `yellowlabtools` to the data object passed into `grunt.initConfig()`.

```js
grunt.initConfig({
  yellowlabtools: {
    production: {
      urls: [
        'https://github.com/',
        'https://github.com/features'
      ],
      failConditions: [
        // The global score is the one calculated by Yellow Lab Tools
        'fail if at least one url has a global score < 80/100',

        // Every single rule has its own score
        'fail if at least one url has a rule score < 50/100',

        // You can be more demanding on a scpecific rule
        'fail if at least one url has a domElementsCount score < 100/100',

        // Or you can decide to be cooler on a specific rule
        'fail if at least one url has a domMaxDepth score < 20/100',
        
        // ... coolest
        'ignore iframesCount',

        // For each rule, you can check directly the metric instead of the score by omitting '/100'
        'fail if at least one url has a domElementsCount > 2000'
      ],
      options: {
        device: 'phone'
      }
    }
  }
});
```


### Options

##### device [String]
Use "phone" or "tablet" to simulate a mobile device (by user-agent and viewport size). Default is "desktop".

##### cookie [String]
Adds a cookie on the main domain. Multiple cookies can be set, comma-separated. Example: `bar1=foo1;domain=.domain1.com|bar2=foo2;domain=www.domain2.com`.

##### authUser [String] & authPass [String]
Your credentials if you need to bypass a basic HTTP authentication.  
If your authentication is not basic, you might be able to copy the session cookie from your browser, paste it in the "Cookie" setting and launch a run before your cookie expires.

##### proxy [String]
YLT will use an HTTP proxy to reach the tested URL. Example: `domain.com:8080`.

##### blockDomain [String]
Disallow requests to given domain(s), aka blacklist. Comma separated.

##### allowDomain [String]
Allow requests to given domain(s), aka whitelist. Comma separated.

##### noExternals [Boolean]
Block requests to all 3rd party domains.

##### locally [Boolean]
By default, runs are launched locally, using the NodeJS version of YLT (without the HTML user interface). If you want to run the tests remotely on a YLT server (the public instance or your own instance), set this boolean to false. Default is true.  
Please note that local tests are much faster than the YLT's public instance, where your runs will be queued and limited to 50 runs per day.  
However, running on a distant server provides you with the url of the HTML report, and that's pretty cool!

##### serverUrl [String]
When `locally` is false, this is the url of the server you want to run the tests on. Default is the public instance `http://yellowlab.tools`.  
If you need to launch more runs (or for any other reason), you can run the test on your own private instance (see [How to install your private server](https://github.com/gmetais/YellowLabTools/wiki/Install-your-private-server)).

##### apiKey [String]
To avoid abuse and keep the service free for everyone, the API will block your IP if you launched more than 50 runs in the last 24h.  
If you have a good reason, please email me so I can give you an api-key. You can also create and host [your private instance](https://github.com/gmetais/YellowLabTools/wiki/Install-your-private-server).


### Usage Examples

#### Define a threshold on Yellow Lab Tools' global score


```js
grunt.initConfig({
  yellowlabtools: {
    production: {
      urls: [
        'http://mywebsite.com'
      ],
      failConditions: [
        'fail if at least one url has a global score < 80/100'
      ]
    }
  }
});
```

The words `if at least one url` are not very relevant when testing only one url. But don't forget them.


#### Define a threshold for every rule

```js
grunt.initConfig({
  yellowlabtools: {
    production: {
      urls: [
        'http://mywebsite.com'
      ],
      failConditions: [
        'fail if at least one url has a rule score < 40/100'
      ]
    }
  }
});
```

#### Ignore the threshold for some specific rules

```js
grunt.initConfig({
  yellowlabtools: {
    production: {
      urls: [
        'http://mywebsite.com'
      ],
      failConditions: [
        'fail if at least one url has a rule score < 40/100',
        'ignore iframesCount',
        'ignore globalVariables'
      ]
    }
  }
});
```

These two ignored rules will never complain again. Please note that ignoring rules will have no effect on the global score.


#### Define a threshold for a single rule

```js
grunt.initConfig({
  yellowlabtools: {
    production: {
      urls: [
        'http://mywebsite.com'
      ],
      failConditions: [
        'fail if at least one url has a DOMelementMaxDepth score < 90/100'
      ]
    }
  }
});
```

See the list of rules in the next chapter.

If you defined a threshold for every rule, adding a single rule condition has the power to override it. For example, you can assert check that every rule score is over 80 **except** DOMelementMaxDepth that can be as low as 12.


#### Define a threshold on a metric

```js
grunt.initConfig({
  yellowlabtools: {
    production: {
      urls: [
        'http://mywebsite.com'
      ],
      failConditions: [
        'fail if at least one url has a DOMelementsCount > 2000'
      ]
    }
  }
});
```

The only difference between a metric threshold and a score threshold is the `score` word before the `<` or `>` operator.

Defining a threshold on a metric overrides any score threshold you might have defined.


## Rules

Here is the list of rules you can threshold.

#### Page weight
* totalWeight: total number of bytes downloaded
* imageOptimization: number of bytes that could be saved by optimising images
* gzipCompression: number of bytes that could be saved by compressing file transfers
* fileMinification: number of bytes that could be saved by minifying JS, CSS and HTML

#### Requests
* totalRequests: total number of HTTP requests made
* domains: number of domains used
* notFound: number of HTTP 404 responses
* multipleRequests: number of static assets that are requested more than once
* smallRequests: requests that are smaller than 2 KB
* lazyLoadableImagesBelowTheFold: images displayed below the fold that could be lazy-loaded
* hiddenImages: images that have a display:none, or one of thier parents

#### DOM complexity
* DOMelementsCount: total number of HTML element nodes
* DOMelementMaxDepth: maximum level on nesting of HTML element node
* iframesCount: number of iframe nodes
* DOMidDuplicated: number of duplicated IDs found in DOM

#### DOM manipulations
* DOMaccesses: number of calls to DOM related functions, from both DOM api and jQuery
* queriesWithoutResults: number of queries that returned nothing
* DOMqueriesAvoidable: number of repeated uses of a duplicated query

#### Scroll bottlenecks
* eventsScrollBound: number of scroll event listeners binded to window or document
* DOMaccessesOnScroll: number of DOM-accessing functions calls on a scroll event

#### Bad JavaScript
* jsErrors: number of JavaScript errors
* documentWriteCalls: number of calls to document.write(ln)
* consoleMessages: number of calls to console.* functions
* globalVariables: number of JS globals variables

#### jQuery
* jQueryVersion: version of jQuery framework (if loaded)
* jQueryVersionsLoaded: number of loaded jQuery "instances"
* jQueryFunctionsUsed: number of different core jQuery functions called on load
* jQueryCallsOnEmptyObject: number of jQuery functions called on an empty jQuery object
* jQueryNotDelegatedEvents: number of events bound without using event delegation

#### CSS complexity
* cssRules: number of CSS rules
* cssComplexSelectors: number of selectors consisting in 4 or more expressions
* cssComplexSelectorsByAttribute: selectors with complex matching by attribute (e.g. `[class$="foo"]`)
* cssColors: number of unique colors used in CSS
* similarColors: colors that are very close to each other
* cssBreakpoints: number of media queries breakpoints
* cssMobileFirst: number of media queries that address small devices

#### Bad CSS
* cssParsingErrors: number of syntax error found in the CSS
* cssImports: number of `@import` rules
* cssDuplicatedSelectors: number of CSS selectors defined more than once
* cssDuplicatedProperties: number of CSS property definitions duplicated within a selector
* cssEmptyRules: number of rules with no properties
* cssExpressions: number CSS expressions (e.g. `expression(document.body.clientWidth > 600 ? "600px" : "auto")`)
* cssImportants: number of properties with value forced by `!important`
* cssOldIEFixes: number of fixes for old versions of Internet Explorer
* cssOldPropertyPrefixes: number of no longer needed vendor prefix (e.g. `--moz-border-radius`)
* cssUniversalSelectors: number of selectors trying to match every element (e.g. `.foo > *`)
* cssRedundantBodySelectors: number of redundant body selectors (e.g. `body .foo`)
* cssRedundantChildNodesSelectors: number of redundant child nodes selectors (e.g. `ul li`, `table tr`)

#### Server config
* http2: the main domain is HTTP/2 or SPDY compatible
* closedConnections: number of requests not keeping the connection alive
* cachingNotSpecified: responses with no caching header sent
* cachingDisabled: responses with caching disabled
* cachingTooShort: responses with too short caching time (less than a week)



## Results

Here is an example of a `yellowlabtools` grunt task failing. I hope it won't happen too often on your website:

![results screenshot](screenshot.png)


## Author
Gaël Métais. I'm a webperf freelance. Follow me on Twitter [@gaelmetais](https://twitter.com/gaelmetais), I tweet about Web Performances, Front-end and new versions of YellowLabTools!

I can also help your company about Web Performances, visit [my website](https://www.gaelmetais.com).
