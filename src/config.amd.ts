var require = {
    async: true,
    paths: {
        dojo: "../node_modules/dojo",
        rxjs: "../node_modules/rxjs/bundles/Rx.min",
        es6shim: "../node_modules/es6-shim/es6-shim.min",
        rx: "../node_modules/rx/dist/rx.lite.min"
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
