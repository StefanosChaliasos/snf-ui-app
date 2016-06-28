import Ember from 'ember';
import {tempSetProperty} from 'snf-ui/snf/common';
import {ItemsControllerMixin} from 'snf-ui/mixins/items'; 
import NameMixin from 'snf-ui/mixins/name';



export default Ember.ArrayController.extend(ItemsControllerMixin, NameMixin, {
  needs: ['application'],
  projectsLoading: true,

  systemProject: Ember.computed.alias("controllers.application.systemProject"),
  
  view: 'grid',
  sortBy: 'name:asc',

  sortFields: [
    {'value': 'name:desc', 'label': 'Sort by name Z → A'},
    {'value': 'name:asc', 'label': 'Sort by name A → Z'},
    {'value': 'count:desc', 'label': 'Sort by items ↓'},
    {'value': 'count:asc', 'label': 'Sort by items ↑'},
    {'value': 'bytes:desc', 'label': 'Sort by size ↓'},
    {'value': 'bytes:asc', 'label': 'Sort by size ↑'},
    {'value': 'last_modified:desc', 'label': 'More recent first'},
    {'value': 'last_modified:asc', 'label': 'Older first'},
  ],

  // throwErrors: function() {
  //   var self = this;
  //   setInterval(function() {
  //     console.log('error....')
  //     self.send('showErrorDialog', {message: 'hi', stack: 'bye'})
  //   }, 3000)
  // }.on('init'),

  sortProperties: function(){
    return ['order:asc', this.get('sortBy')];
  }.property('sortBy'),

  projects: function(){
    var self = this;
    var projects = this.store.find('project', {mode: 'member'}).then(function(p){
      self.set('projectsLoading', false);
      return p;
    });
    return DS.PromiseArray.create({promise: projects});
  }.property(),

  newProject: function(){
    return this.get('systemProject');
  }.property('systemProject'),

  /*
  * Pithos API allows the name of containers to have at most 256 chars
  * When a new container is created the length of the name is checked
  */
  nameMaxLength: 256,

  newName: undefined,

  isUnique: function() {
    if(this.get('newName')) {
      /*
      * hasRecordForId: Returns true if a record for a given type and ID
      * is already loaded.
      * In our case the id of a container it's its name.
      */
      var uuid = this.get('settings.uuid');
      var isUnique = !this.get('store').hasRecordForId('container', uuid + '/' +  this.get('newName'));
      return isUnique;
    }
    else {
      return true;
    }
  }.property('newName'),

  freezeCreateContainer: true,

  actions: {
    refresh: function(){
      this.set('sortBy', 'name:asc');
      this.send('refreshRoute');
    },


  createContainer: function(){
    if(!this.get('freezeCreateContainer')) {
      var self = this;
      var name = this.get('newName');
      var project = this.get('newProject');

      var uuid = this.get('settings.uuid');
      var container = this.store.createRecord('container', {
        name: name,
        id: uuid + '/' + name,
        project: project,
        versioning: 'auto'
      });

      var onSuccess = function(container) {
        self.get('model').pushObject(container);
        tempSetProperty(container, 'new');
      };


      var onFail = function(reason){
        self.send('showErrorDialog', reason);
      };
      this.set('newProject', this.get('systemProject'));
      container.save().then(onSuccess, onFail);

      // reset
      this.set('newName', undefined);
      this.set('closeDialog', true);
    }
  },

    sortBy: function(property){
      this.set('sortBy', property);
    },

  }
});
