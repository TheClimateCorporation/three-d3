define([
  'scripts/common/collections/csv-collection',
], function(CsvCollection) {

  return CsvCollection.extend({

    url: require.toUrl('data/csv/sf-housing-prices.csv')
  });
});