// requestAnimationFrame() shim by Paul Irish
// http://paulirish.com/2011/requestanimationframe-for-smart-animating/
window.requestAnimFrame = (function() {
    return  window.requestAnimationFrame   ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame    ||
        window.oRequestAnimationFrame      ||
        window.msRequestAnimationFrame     ||
        function(callback) {
            window.setTimeout(callback, 1000 / 60);
        };
}());

_.extend(window, {
    GSWAT: null
});

(function(window, document, $, _, yepnope, undefined) {
    GSWAT = function () {
        // Object Variables
        this.view_instances         = {};
        this.model_instances        = {};
        this.collection_instances   = {};
        this.main_ele               = '#content';
        this.default_route          = 'home';
        this.CDN                    = '';
        this.files_loaded           = [];
        this.timers                 = {};
		this.Lib					= Lib || undefined;
    };

	/**
	 * Generic method for returning an object
	 *
	 * @param  {string} item model|collection
	 * @param  {object} data
	 * @return {instance}
	 */
        var get_item = function(item,data){
            var instances = this[item + '_instances'];
            var name = data.name;
            var defined = !_.isUndefined(instances[name]);
            var instance;
            if(data.reset && defined){
				if(item !== 'view'){
					instances[name].destroy();
				}
				delete instances[name];
            }
			instance = defined ? instances[name] : create_item.call(this,item,data);
            return instance;
        };

    /**
	 * Generic method for creating an object
	 *
	 * @param  {string} item model|collection
	 * @param  {object} data
	 * @return {instance}
	 */
    var create_item = function(item,data){
        var definitions = this[item + '_definitions'];
        var name = data.name;
        var defined = !_.isUndefined(definitions[name]);
        var instance;
        if(defined){
            instance = this[item + '_instances'][name] = new definitions[name];
            if(data.options){
                _.each(data.options,function(value,option){
                    instance[option] = value;
                });
            }
            if(data.data){
                instance.set(data.data);
            }
            instance.name = name;
            this[item + '_instances'][name].listenTo(this[item + '_instances'][name],'destroy',_.bind(function(){
                delete this[item + '_instances'][name];
            },this));
        } else {
            throw new Error('Definition "' + name + '" of type "' + item + '" not found');
        }
        return instance;
    };

    GSWAT.prototype = {
        get_model: function(model_data){
            return get_item.call(this,'model',model_data);
        },

        get_collection: function(collection_data){
            return get_item.call(this,'collection',collection_data);
        },

        get_view: function(view_data,model_data,collection_data){
            var views = this.view_instances;
            var name = view_data.name;
            var view;
			if(views[name] && view_data.reset){
				views[name].remove();
			}
			view = views[name] && !view_data.reset ? views[name] : this.create_view(view_data,model_data,collection_data);
            return view;
        },

        create_view: function(view_data,model_data,collection_data){
            var name = view_data.name;
            var view = this.view_definitions[name];
			if(!_.isUndefined(view)){
				if(view_data.options){
					_.each(view_data.options,function(value,option){
						view[option] = value;
					});
				}
				var model = model_data && !(model_data instanceof Backbone.Model) ? this.get_model(model_data) : model_data;
				var collection = collection_data && !(collection_data instanceof Backbone.Collection) ? this.get_collection(collection_data) : collection_data;
				view = view ? this.view_instances[name] = new view({model: model,collection: collection}) : '';
				this.view_instances[name].listenTo(this.view_instances[name],'remove',_.bind(function(){
					var model = this.view_instances[name].model;
					var collection = this.view_instances[name].collection;
					if(model){
						model.destroy();
					}
					if(collection){
						collection.destroy();
					}
					delete this.view_instances[name]
				},this));
				view.name = name;
				return view;
			} else {
				throw new Error('Definition "' + name + '" of type "view" not found');
			}
        },

        get: function(object){
            /*
			 *{
			 *	view: {
			 *		name: 'view-name',
			 *		reset: true, // Delete existing and create new instance
			 *		options: {} // Set any number of view parameters like initialize, el, tagName, etc
			 *	},
			 *	model: {
			 *		name: 'model-name',
			 *		reset: true, // Delete existing and create new instance
			 *		data: {}, // Set model initial data
			 *		options: {} // Set any number of model parameters like attributeId, initialize, etc
			 *	},
			 *	collection: {
			 *		name: 'collection-name',
			 *		reset: true // Delete existing and create new instance
			 *	}
			 *}
			 */
            var item;
            if(object.view){
                item = this.get_view(object.view,object.model,object.collection);
            } else if(object.model){
                item = this.get_model(object.model);
            } else if(object.collection){
                item = this.get_collection(object.collection);
            }
            return item;
        },

        render: function(view,persist){
            if(!_.isUndefined(this.current_view) && !persist){
                var old_view = this.get({view: {name: this.current_view}});
                old_view.remove();
                delete this.view_instances[this.current_view];
            }
            this.current_view = view.name;
            view.render();
            this.$el.html(view.el);
        },

        set_options: function(options){
            var scope = this;
            $.each(options,function(index,option){
                scope[index] = option;
            });
			this.$el = $(this.main_ele);
        },

        init: function (options) {
            if (!_.isUndefined(this.Lib)) {
                _.extend(this, new this.Lib());
            }
            var _super = Backbone.View.prototype.remove;
            Backbone.View.prototype.remove = function () {
                this.trigger('remove');
                return _super.apply(this, arguments);
            };

            this.set_options(options);
            if (window.location.hash == undefined || window.location.hash == ''){
                window.location.hash = this.default_route;
            }
            this.active_router = new this.router();
            Backbone.history.start();
        }
    };

    // Global objects for our views/models/collections/events
    _.extend(GSWAT.prototype, {
        view_definitions : {},
        model_definitions : {},
        collection_definitions : {}
    });
}(window, document, jQuery, _, yepnope));