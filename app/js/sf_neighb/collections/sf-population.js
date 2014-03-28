define([
  'js/common/collections/csv-collection'
], function(CsvCollection) {

  return CsvCollection.extend({

    url: require.toUrl('csv/sf-population.csv')
  });
});