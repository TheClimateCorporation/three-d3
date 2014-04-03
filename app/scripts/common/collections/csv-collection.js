define([
  'backbone',
  'csvjson'
], function(Backbone, csvjson) {

  return Backbone.Collection.extend({

    fetch: function(options) {
      options = _.defaults({
        dataType: 'text'
      }, options || {});
      Backbone.Collection.prototype.fetch.call(this, options);
    },

    parse: function(response) {
      if (_.isObject(response)) {
        return response;
      } else {
        var json = csvjson.csv2json(response, {
          delim: ',',
          textdelim: '\"'
        });
        return json.rows;
      }
    }
  });
});