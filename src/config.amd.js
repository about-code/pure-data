var require = {
    baseUrl: "./",
    async: true,
    paths: {
        dojo: "../bower_components/dojo",
        rxjs: "../bower_components/rxjs/dist/rx.lite.min",
        es6Promise: "../bower_components/es6-promise/promise.min",
        rx: "../bower_components/rxjs/dist/rx.min"
    },
    packages: [
        {
            name: "pure",
            location: "./"
        },
        {
            name: "collection",
            location: "./collection"
        },
        {
            name: "data",
            location: "./data"
        },
        {
            name: "util",
            location: "./util"
        },
    ],
    deps: [
        "es6Promise"
    ],
    debug: true
},
dojoConfig = require;
