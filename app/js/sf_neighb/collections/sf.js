define([
  'js/common/collections/features',
  'd3'
], function(Features, d3) {

  return Features.extend({

    projection: d3.geo.albers(),

    scaling: 170000,
    translateX: 59300,
    translateY: 5700,

    url: require.toUrl('json/sf.json')
  });
});