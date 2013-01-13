(function(window, $, _, ich) {
    _.extend(window.GSWAT.prototype.view_definitions, {
        settings: Backbone.View.extend({
            events: {
                //
            },

            el: '#content',

            initialize: function () {
                this.subviews = {};
                this.subviews.server_settings_view = PBF.get_view('server_settings', 'server_model');
                this.subviews.chat_settings = PBF.get_view('chat_settings', 'chat_model');
            },

            render: function () {
                this.$el.html(ich.tpl_settings());
                this.render_sub_views();
                this.delegateEvents(); // TODO: Properly fix this event issue
            },

            render_sub_views: function () {
                var view = this;
                _.each(view.subviews, function (sub_view) {
                    sub_view.render();
                    view.$el.find('#' + sub_view.id).replaceWith(sub_view.el);
                    sub_view.delegateEvents(); // TODO: Properly fix this event issue
                });
            }
        }),

        chat_settings: Backbone.View.extend({
            events: {
                'click input:submit'    : 'submit',
                'click button.helper'   : 'clear_field',
                'change .switch input'  : 'change_switch'
            },

            id: 'chat-settings',

            initialize: function () {
                //
            },

            submit: function (event) {
                event.preventDefault();
                var val = parseInt(this.$el.find('#chat-interval-field input').val());
                if (!isNaN(val)) {
                    this.model.set({ 'interval': val });
                } else {
                    // Not a number, do something
                }
            },

            change_switch: function (event) {
                var ele = $(event.currentTarget);
                var val = {};
                val[ele.attr('data-field')] = ele.is(':checked');
                this.model.set(val);
            },

            clear_field: function (event) {
                event.preventDefault();
                $(event.currentTarget).siblings('input').val('');
            },

            render: function () {
                this.$el.html(ich.tpl_chat_settings(this.model.toJSON()));
            }
        }),

        server_settings: Backbone.View.extend({
            events: {
                'click input:submit'    : 'submit',
                'click button.helper'   : 'clear_field'
            },

            id: 'server-settings',

            initialize: function () {
                this.model.bind('change:settings_success', this.update_confirm());
            },

            submit: function (event) {
                event.preventDefault();
                var form = this.$el.find('form').serializeArray();
                var values = {}
                _.each(form, function (input) {
                    values[input.name] = input.value;
                });
                this.model.update_settings(values);
                values.settings_success = 3;
                this.model.set(values, { silent: true });
            },

            update_confirm: function () {
                console.log('success',this.model.get('settings_success'));
            },

            clear_field: function (event) {
                event.preventDefault();
                $(event.currentTarget).siblings('input').val('');
            },

            render: function () {
                this.$el.html(ich.tpl_server_settings(this.model.toJSON()));
            }
        })
    });
}(window, jQuery, _, ich));