var require = {
    async: true,
    paths: {
        dojo: "../bower_components/dojo",
        rxjs: "../bower_components/rxjs/dist/rx.lite.min",
        es6shim: "../node_modules/es6-shim/es6-shim.min",
        rx: "../bower_components/rxjs/dist/rx.min"
    },
    packages: [
        { name: "pure", location: "./" },
        { name: "collection", location: "./collection" },
        { name: "data", location: "./data" },
        { name: "util", location: "./util" },
    ],
    deps: [
        "es6shim",
        "pure/main"
    ],
    debug: true
},
dojoConfig = require;
