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
        concat: {
            options: {
                banner: '<%= banner %>',
                stripBanners: true
            },
            dist: {
                src: ['src/pure-data.js'],
                dest: 'dist/pure-data.js'
            }
        },
        uglify: {
            options: {
                banner: '<%= banner %>'
            },
            dist: {
                src: '<%= concat.dist.dest %>',
                dest: 'dist/pure-data.min.js'
            }
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
        bower: {
            all: {
                rjsConfig: "src/config.js",
                options: {
                    baseUrl: "src",
                    exclude: []
                }
            }
        },
        dojo: {
            dist: {
              options: {
                dojo: 'bower_components/dojo/dojo.js', // Path to dojo.js file in dojo source
                load: 'build', // Optional: Utility to bootstrap (Default: 'build')
                profile: 'build.profile.js', // Profile for build
                profiles: [], // Optional: Array of Profiles for build
                appConfigFile: '', // Optional: Config file for dojox/app
                package: './', // Optional: Location to search package.json (Default: nothing)
                packages: [], // Optional: Array of locations of package.json (Default: nothing)
                require: '', // Optional: Module to require for the build (Default: nothing)
                requires: [], // Optional: Array of modules to require for the build (Default: nothing)
                cwd: './', // Directory to execute build within
                dojoConfig: 'src/config.js', // Optional: Location of dojoConfig (Default: null),
                // Optional: Base Path to pass at the command line
                // Takes precedence over other basePaths
                // Default: null
                basePath: ''
              }
            },
            options: {
              // You can also specify options to be used in all your tasks
              dojo: 'bower_components/dojo/dojo.js', // Path to dojo.js file in dojo source
              //load: 'build', // Optional: Utility to bootstrap (Default: 'build')
              profile: 'build.profile.js', // Profile for build
              profiles: [], // Optional: Array of Profiles for build
              appConfigFile: '', // Optional: Config file for dojox/app
              package: './', // Optional: Location to search package.json (Default: nothing)
              packages: [], // Optional: Array of locations of package.json (Default: nothing)
              require: '', // Optional: Module to require for the build (Default: nothing)
              requires: [], // Optional: Array of modules to require for the build (Default: nothing)
              cwd: './', // Directory to execute build within
              dojoConfig: 'src/config.js', // Optional: Location of dojoConfig (Default: null),
              // Optional: Base Path to pass at the command line
              // Takes precedence over other basePaths
              // Default: null
              basePath: ''
            }
        },
        requirejs: {
            compile: {
                options: {
                    out: "./build/pure-data.min.js",
                    mainConfigFile: "src/config.js",
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
        jsdoc : {
            dist : {
                src: ['src/**/*.js'],// 'test/**/*.js'],
                options: {
                    destination: 'dist/doc',
                    configure  : "jsdoc.json"
                }
            }
        }
    });

    // These plugins provide necessary tasks
    /*grunt.loadNpmTasks('grunt-contrib-concat');*/
    /*grunt.loadNpmTasks('grunt-contrib-uglify');*/
    /*grunt.loadNpmTasks('grunt-contrib-watch');*/
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-requirejs');
    grunt.loadNpmTasks('grunt-dojo');
    grunt.loadNpmTasks('grunt-bower-requirejs');
    grunt.loadNpmTasks('grunt-jsdoc');
    grunt.loadNpmTasks('intern');

    // Create tool-independent tasks and map them on tool-specific tasks.
    grunt.registerTask('test',    [/*'jshint', */'intern']);
    grunt.registerTask('build',   [/*'concat', 'uglify',*/'requirejs']);
    grunt.registerTask('doc',     ['jsdoc']);
    grunt.registerTask('dist',    ['copy']);
    grunt.registerTask('default', ['test', 'build', 'doc', 'dist']);
};
