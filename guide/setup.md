1. Get a clone (or just download the .zip)
```
git clone https://github.com/devpunk/pure-data.git
cd pure-data
```

2. Install node dependencies
```
npm install
```

3. Install bower dependencies
```
bower install
```

4. check out build steps
```javascript
grunt jsdoc   // should generate a nice API-Doc into dist/doc
grunt jshint  // may show some warnings about messy code
grunt test    // should run intern with the unit tests in test/unit and print some test result
grunt build   // should create a pure-data.min.js and pure-data.min.js.map in /build
grunt         // runs them all
```
