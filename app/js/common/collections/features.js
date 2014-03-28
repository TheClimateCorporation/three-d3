define([
  'backbone',
  'd3'
], function(Backbone, d3) {

  return Backbone.Collection.extend({

    _geoPathGenerator: null,

    projection: d3.geo.mercator(),

    scaling: null,
    translateX: null,
    translateY: null,

    initialize: function(options) {
      this._geoPathGenerator = d3.geo.path().projection(this.projection);
      this.translate(this.projection.translate());
      this.scale(this.scaling);
    },

    parse: function(response) {
      return response.features;
    },

    getGeoPathGenerator: function() {
      return this._geoPathGenerator;
    },

    translate: function(translate) {
      translate[0] = this.translateX;
      translate[1] = this.translateY;
      this.projection.translate(translate);
    },

    scale: function(scaling) {
      this.projection.scale(scaling);
    },

    toGeoJson: function() {
      var features = this.map(function(model) {
        return model.toJSON();
      });
      return this.constructor.featurestoGeoJson(features);
    }
  }, {
    // Class properties
    featurestoGeoJson: function(features) {
      return {
        type: 'FeatureCollection',
        features: features
      }
    }
  });
});