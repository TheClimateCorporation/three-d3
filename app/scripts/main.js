/*global require*/
'use strict';

require.config({

    baseUrl: '../',

    shim: {
        underscore: {
            exports: '_'
        },
        backbone: {
            deps: [
                'underscore',
                'jquery'
            ],
            exports: 'Backbone'
        },
        three: {
            exports: 'THREE'
        },
        terrainLoader: {
            deps: ['three'],
            exports: 'THREE'
        },
        trackballControls: {
            deps: ['three'],
            exports: 'THREE'
        },
        d3: {
            exports: 'd3'
        },
        csvjson: {
          exports: 'csvjson'
        }
    },
    paths: {
        jquery: 'bower_components/jquery/jquery',
        backbone: 'bower_components/backbone/backbone',
        underscore: 'bower_components/underscore/underscore',
        three: 'bower_components/threejs/build/three',
        terrainLoader: 'scripts/vendor/terrain-loader',
        trackballControls: 'scripts/vendor/trackball-controls',
        d3: 'scripts/vendor/d3.v3.min',
        dthree: 'scripts/vendor/dthree',
        csvjson: 'scripts/vendor/csvjson.min'
    }
});

require([
    'scripts/viz/views/sf.dthree',
], function (SfDThreeView) {
    var sfDThreeView = new SfDThreeView({
        el: '#container'
    });
});
