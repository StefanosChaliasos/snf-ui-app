import Ember from 'ember';
import ResolveSubDirsMixin from 'snf-ui/mixins/resolve-sub-dirs';
import {tempSetProperty, bytesToHuman} from 'snf-ui/snf/common';

export default Ember.Controller.extend(ResolveSubDirsMixin,{
  itemType: 'container',
  container_view: true,
  needs: ['containers', 'application'],
  loading: false,
  closeDialog: false,

  projects: Ember.computed.alias("controllers.containers.projects"),
  gridView: Ember.computed.alias("controllers.containers.gridView"),
  listView: Ember.computed.alias("controllers.containers.listView"),
  containersModel: Ember.computed.alias("controllers.containers.model"),

  canEmpty: Ember.computed.bool('model.count'),
  canDelete: Ember.computed.not('model.isTrash'),

  availableProjects: function(){
    var self = this;
    // show only projects whose free space is enough for the container or
    // that the container is already assigned to
    return this.get('projects').filter(function(p){
      return self.get('model').get('bytes')<= p.get('disk_free_space') ||
        self.get('model').get('project').get('id') == p.get('id');
      ;
    });
  }.property('projects.@each'),

  selectedProject: function(){
    var project_id = this.get('model').get('project').get('id');
    return this.get('availableProjects').findBy('id', project_id) ;
  }.property('availableProjects', 'model.project'),

  isSelectedProjectOverquota: function() {
    var proj = this.get('model').get('project');
    var overquotaAmount = proj.get('disk_overquota_space');
    if(overquotaAmount) {
      return true;
    }
    else {
      return false;
    }
  }.property('model.project', 'model.project.disk_overquota_space'),

  actionToPerform: undefined,

  verb_for_action: function(){
    var action = this.get('actionToPerform');
    var dict = {
      'emptyAndDelete': 'delete',
      'emptyContainer': 'empty',
    };
    return dict[action];
  }.property('actionToPerform'),

  confirm_intro: function(){
    if (this.get('verb_for_action')) {
      var verb =  this.t('action_verb.'+this.get('verb_for_action'));
      var type = this.get('itemType');
      var name = this.get('model.name');
      return this.t('overlay.confirm_simple.intro', 1, verb , type, name);
    }
  }.property('verb_for_action', 'model.name'),

  confirm_button: function(){
    if (this.get('verb_for_action')) {
      return this.t('button.'+this.get('verb_for_action'));
    }
  }.property('verb_form_action'),


  watchProject: function(){
    var sel = this.get('selectedProject');
    if (sel && this.get('model.project.id')!=sel.get('id')){
      this.send('reassignContainer', sel.get('id'));
      this.set('project', sel);
    }
  }.observes('selectedProject'),

  isNew: function(){
    if (this.get('model.new')) {
      return 'new';
    }
  }.property('model.new'),

  isLoading: function(){
    if (this.get('loading')){
      return 'loading';
    }
  }.property('loading'),

  isTrash: function(){
    if (this.get('model.isTrash')){
      return 'is-trash';
    };
  }.property('model.isTrash'),

  actions: {

    deleteContainer: function(){
      this.set('closeDialog', true);
      var container = this.get('model');
      var self = this;
      self.set('loading', false);
      var containersModel = this.get('containersModel');
      var onSuccess = function(container) {
        containersModel.removeObject(container);
      };

      var onFail = function(reason){
        self.send('showErrorDialog', reason)
      };
      container.destroyRecord().then(onSuccess, onFail)

    },

    emptyAndDelete: function() {
      this.send('emptyContainer', true);
    },

    emptyContainer: function(delete_flag){
      var container = this.get('model');
      var self = this;

      this.set('closeDialog', true);
      this.set('loading', true);
      var onSuccess = function() {
        if (delete_flag) {
          self.send('deleteContainer');
        } else {
          container.set('count',0);
          container.set('bytes',0);
          self.set('loading', false);
        }
      };
      var onFail = function(reason){
        self.send('showErrorDialog', reason)
      };
      this.store.emptyContainer('container', container).then(onSuccess, onFail);
    },

    reassignContainer: function(project_id){
      var self = this;
      var container = this.get('model');
      this.set('loading', true);
      var onSuccess = function() {
        self.set('loading', false);
      };

      var onFail = function(reason){
        self.send('showErrorDialog', reason)
      };
      this.store.reassignContainer('container', container, project_id).then(onSuccess, onFail);
    }
  }
});
