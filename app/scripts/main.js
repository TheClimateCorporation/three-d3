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
            exports: 'TerrainLoader'
        },
        trackballControls: {
            deps: ['three'],
            exports: 'TrackBallControls'
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
    'js/sf_neighb/views/sfgeo3d',
    //'js/tahoe/views/terrain',
    //'js/learn/views/learn-three',
    'backbone'
], function (SfGeo3d, Backbone) {
    /*var learnThreeView = new LearnThreeView({
        el: '#container'
    });
    learnThreeView.render();*/
    window.terrainView = new SfGeo3d({
        el: '#container'
    });
    Backbone.history.start();
});
