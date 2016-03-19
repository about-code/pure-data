module.exports = function (grunt) {
    'use strict';
    // Project configuration
    grunt.initConfig({
        // Metadata
        pkg: grunt.file.readJSON('package.json'),
        banner: '/*! <%= pkg.name %> - v<%= pkg.version %> - ' +
            '<%= grunt.template.today("yyyy-mm-dd") %>\n' +
            '<%= pkg.homepage ? "* " + pkg.homepage + "\\n" : "" %>' +
            '* Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author.name %>;' +
            ' Licensed <%= props.license %> */\n',
        // Task configuration
        watch: {
            gruntfile: {
                files: '<%= jshint.gruntfile.src %>',
                tasks: ['jshint:gruntfile']
            },
            lib_test: {
                files: '<%= jshint.lib_test.src %>',
                tasks: ['jshint:lib_test', 'qunit']
            }
        },
        ts: {
            default : {
                src: ["src/**/*.ts", "test/**/*.ts", "!node_modules/**/*.*", "!bower_components/**/*.*"],
                tsconfig: {
                    tsconfig: "./tsconfig.json",
                    overwriteFilesGlob: true
                }
            },
        },
        jshint: {
            options: {
                node: true,
                curly: true,
                eqeqeq: true,
                immed: true,
                latedef: true,
                newcap: true,
                noarg: true,
                sub: true,
                undef: true,
                unused: true,
                eqnull: true,
                browser: true,
                globals: { jQuery: true },
                boss: true
            },
            gruntfile: {
                src: 'gruntfile.js'
            },
            lib_test: {
                src: ['src/**/*.js', 'test/**/*.js']
            }
        },
        intern: {
            someReleaseTarget: {
                options: {
                    runType: 'client', // defaults to 'client'
                    config: 'test/intern',
                    reporters: [ 'console', 'lcov' ],
                    suites: [ 'test/unit/module' ]
                }
            }
        },
        bower: {
            all: {
                rjsConfig: "src/config.amd.js",
                options: {
                    baseUrl: "src",
                    exclude: []
                }
            }
        },
        requirejs: {
            compile: {
                options: {
                    out: "./build/pure-data.min.js",
                    mainConfigFile: "src/config.amd.js",
                    name: "main",
                    optimize: "uglify2",
                    preserveLicenseComments: false,
                    generateSourceMaps: true
                }
            }
        },
        copy: {
            main: {
                files: [{
                    expand: true,
                    cwd: './build/',
                    src: ['./**/*'],
                    dest: 'dist/'
                }]
            }
        },
        typedoc: {
            build: {
                options: {
                    module: 'amd',
                    out: './doc/api',
                    name: 'pure-data',
                    target: 'es5',
                    ignoreCompilerErrors: ""
                },
                src: ['./src/**/*.ts', '!./src/**/config.*', '!./src/**/*build.r.*']
            }
        },
        clean: {
            options: {
                force: true, // use until grunt was updated with https://github.com/gruntjs/grunt/issues/1469 fixed
            },
            ts: [
                './src/**/*.js',
                './src/**/*.map',
                './test/unit/**/*.js',
                '!./test/unit/**/module.js',
                '!./test/unit/notImplemented.js'
            ],
            //filter: 'isFile',
        },
    });

    // These plugins provide necessary tasks
    grunt.loadNpmTasks("grunt-ts");
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-requirejs');
    grunt.loadNpmTasks('grunt-bower-requirejs');
    grunt.loadNpmTasks('grunt-typedoc');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('intern');

    // Create tool-independent tasks and map them on tool-specific tasks.
    grunt.registerTask("transpile", ["ts"]);
    grunt.registerTask('test',      ['transpile', 'intern']);
    grunt.registerTask('bundle',    ['requirejs']);
    grunt.registerTask('doc',       ['typedoc']);
    grunt.registerTask('dist',      ['copy']);
    grunt.registerTask('clean-ts',     ['clean:ts'])
    grunt.registerTask('default',   ['test', 'bundle', 'doc', 'dist']);
};
