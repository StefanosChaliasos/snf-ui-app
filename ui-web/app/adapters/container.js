import DS from 'ember-data';
import Ember from 'ember';

export default DS.RESTAdapter.extend({
  headers: function(){
    return {'X-Auth-Token': this.get('settings').get('token'),
              'X-Requested-With': 'XMLHttpRequest',
              'Content-Type': 'application/json'};
  }.property(),
  host: function(){
    return this.get('settings').get('storage_host');
  }.property(),
  buildURL: function(type, id, record){
    var url = [],
        host = this.get('host');
    url.push(host);
    if (id) {
      url.push(id);
    }
    url = url.join('/');
    return url;
  },
  ajaxSuccess: function(jsonPayload, jqXHR) {
    var ret = this._super(jsonPayload, jqXHR);
    return ret;
  },
  // this is a DS.adapter method
  // it could be a d DS.rest_adapter method 
  // record is returned from Store's createRecord method
  createRecord: function(store, type, record) {
    var data = this.serialize(record, { includeId: true });
    var url = this.buildURL(type.typeKey, data.name , null);
    var headers = this.get('headers');
    $.extend(headers, {'X-Container-Policy-Project': '7140a2ea-e102-485f-b74d-d37ddcbf5ca9'});


    return new Ember.RSVP.Promise(function(resolve, reject) {
      jQuery.ajax({
        type: 'PUT',
        url: url,
        // http://stackoverflow.com/questions/5061310/
        dataType: 'text',
        headers: headers,
      }).then(function(data) {
        Ember.run(null, resolve, data);
      }, function(jqXHR) {
        var response = Ember.$.parseJSON(jqXHR.responseText);
        console.log(response, '####');
        jqXHR.then = null; // tame jQuery's ill mannered promises
        Ember.run(null, reject, jqXHR);
      });
    });
  },
  deleteRecord: function(store, type, record){
    var id = Ember.get(record, 'id');
    return this.ajax(this.buildURL(type.typeKey, id, record), "DELETE");
  },
  emptyContainer: function(store, record){
    alert('I am going to empty this container');
  },
});
