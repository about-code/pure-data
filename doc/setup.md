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
grunt doc       // generates a nice API-Doc into /doc/api
grunt transpile // translates typescript files
grunt test      // runs transpile and intern unit tests (if there are transpile errors try running with --force)
grunt bundle    // creates a pure-data.min.js and pure-data.min.js.map in /build
grunt           // runs them all
```
