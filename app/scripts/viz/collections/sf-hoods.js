define([
  'scripts/common/collections/csv-collection',
], function(CsvCollection) {

  return CsvCollection.extend({

    url: '/data/csv/sf-neighborhoods.csv',

    parse: function(data) {
      var rows = CsvCollection.prototype.parse.apply(this, arguments);
      return _.chain(rows).groupBy('zip').map(function(zipHoods, zip) {
        return {
          zip: parseInt(zip),
          hoods: _.pluck(zipHoods, 'hood')
        }
      }).value();
    }
  });
});