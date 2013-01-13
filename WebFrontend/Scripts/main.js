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
        this.default_route          = 'main';
        this.CDN                    = '';
        this.files_loaded           = [];
        this.timers                 = {};
    };

    GSWAT.prototype = {
        get_model: function(model_name,data){
            var models = this.model_instances;
            var model = (models[model_name])? models[model_name] : this.create_model(model_name);
            if(data){
                model.set(data);
            }
            return model;
        },

        get_view: function (view_name, model_name, reset) {
            var view = {};
            if (model_name === true || reset === true) {
                view = this.create_view(view_name, model_name);
            } else {
                var views = this.view_instances;
                view = (views[view_name]) ? views[view_name] : this.create_view(view_name, model_name);
            }
            return view;
        },

        get_collection: function(collection_name){
            var collections = this.collection_instances;
            var collection = (collections[collection_name])? collections[collection_name] : this.create_collection(collection_name);
            return collection;
        },

        create_model: function(model_name){
            var model = this.model_definitions[model_name];
            model = (model)? this.model_instances[model_name] = new model() : '';
            return model;
        },

        create_view: function(view_name,model_name){
            var view = this.view_definitions[view_name];
            var model = (!model_name || typeof model_name !== 'object')? this.get_model(model_name) : model_name;
            view = (view)? this.view_instances[view_name] = new view({model: model}) : '';
            return view;
        },

        create_collection: function(collection_name){
            var collection = this.collection_definitions[collection_name];
            collection = (collection)? this.collection_instances[collection_name] = new collection() : '';
            collection.name = collection_name;
            return collection;
        },

        load: function (files, callback) {
            var loading = this.get_view('loading');
            loading.render();

            var files_loaded = this.files_loaded;
            var files_needed = _.difference(files, files_loaded);
            this.files_loaded = files_loaded.concat(files_needed);
            if (files_needed.length) {
                var last = _.last(files_needed);
                yepnope([{
                    load: files_needed,
                    callback: function (url) {
                        if (url === last) {
                            return callback();
                        }
                    }
                }]);
            } else {
                return callback();
            }
        },

        set_options: function(options){
            var scope = this;
            $.each(options,function(index,option){
                scope[index] = option;
            });
        },

        init: function(options) {
            this.set_options(options);
            if (window.location.hash == undefined || window.location.hash == ''){
                window.location.hash = this.default_route;
            }
            if (window.lib) {
                this.lib = new window.lib();
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