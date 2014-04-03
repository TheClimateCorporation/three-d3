define([
  'scripts/common/collections/csv-collection'
], function(CsvCollection) {

  return CsvCollection.extend({

    url: '/data/csv/sf-population.csv'
  });
});