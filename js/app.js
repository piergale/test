/*
 * Copyright (c) 2012 Samsung Electronics Co., Ltd. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/*jslint devel:true*/
/*global Config, Model, Ui, tizen */

/**
 * Application class constructor.
 *
 * @public
 * @constructor
 */
var App = null;

(function strict() { // strict mode wrapper
    'use strict';

    /**
     * Creates a new application object.
     *
     * @public
     * @constructor
     */
    App = function App() {
        return;
    };

    App.prototype = {

        /**
         * Array with application dependencies.
         *
         * @private
         * @type {string[]}
         */
        requires: ['js/app.config.js', 'js/app.model.js', 'js/app.alarm.js',
            'js/app.ui.js', 'js/app.ui.templateManager.js',
            'js/app.ui.templateManager.modifiers.js'],

        /**
         * Config object.
         *
         * @private
         * @type {Config}
         */
        config: null,

        /**
         * Model object.
         *
         * @private
         * @type {Model}
         */
        model: null,

        /**
         * Ui object.
         *
         * @private
         * @type {Ui}
         */
        ui: null,

        /**
         * Application control data key.
         *
         * @private
         * @const {string}
         */
        APP_CONTROL_DATA_KEY: 'http://tizen.org/appcontrol/data/alarm_id',

        /**
         * Application control operation URI.
         *
         * @public
         * @const {string}
         */
        APP_CONTROL_OPERATION_URI:
            'http://tizen.org/appcontrol/operation/exercise',

        /**
         * Initializes application.
         *
         * @public
         * @returns {App}
         */
        init: function init() {
            // instantiate the libs
            this.config = new Config();
            this.model = new Model();
            this.ui = new Ui();

            // initialize the modules
            this.model.init(this);
            this.ui.init(this, this.getExerciseId());

            return this;
        },

        /**
         * Returns this application id.
         *
         * @public
         * @returns {number} Application id.
         */
        getId: function getId() {
            return tizen.application.getCurrentApplication().appInfo.id;
        },

        /**
         * Returns connected exercise id.
         *
         * @private
         * @returns {string} Exercise id or undefined.
         */
        getExerciseId: function getExerciseId() {
            var reqAppControl = tizen
                    .application
                    .getCurrentApplication()
                    .getRequestedAppControl(),
                data = null,
                len = 0,
                exerciseId = 0;

            if (reqAppControl) {
                data = reqAppControl.appControl.data;
                len = data.length - 1;

                while (len >= 0) {
                    if (data[len].key === this.APP_CONTROL_DATA_KEY) {
                        exerciseId = data[len].value[0];
                        break;
                    }
                    len -= 1;
                }

                return exerciseId;
            }
        },

        /**
         * Closes application.
         *
         * @public
         */
        exit: function exit() {
            tizen.application.getCurrentApplication().exit();
        },

        /**
         * Adds exercise to the storage.
         *
         * @public
         * @param {object} exercise
         * @param {function} [success] Callback function.
         * @param {function} [failure] Callback function.
         */
        addExercise: function addExercise(exercise, success, failure) {
            // if add was successful
            if (this.model.add(exercise)) {
                if (success instanceof Function) {
                    success();
                }
            } else { // if add fail
                console.error('problem with adding exercise');
                if (failure instanceof Function) {
                    failure();
                }
            }
        },

        /**
         * Returns all stored exercises.
         *
         * @public
         * @returns {object[]} List of exercises.
         */
        getAllExercises: function getAllExercises() {
            return this.model.getAll();
        },

        /**
         * Returns single exercise which match value in corresponding key.
         *
         * @param {string} attr  Attribute name.
         * @param {*} value
         * @returns {Object|undefined} Exercise object.
         */
        getExercise: function getExercise(attr, value) {
            return this.model.find(attr, value)[0];
        },

        /**
         * Removes exercise from the storage.
         *
         * @public
         * @param {string} exerciseId
         * @param {function} [success] Callback function.
         * @param {function} [failure] Callback function.
         */
        removeExercise: function removeExercise(exerciseId, success, failure) {
            // if removed was successfully completed
            if (this.model.remove(exerciseId)) {
                if (success instanceof Function) {
                    success();
                }
            } else { // if there was problem with removing exercise
                console.error('problem with removing');
                if (failure instanceof Function) {
                    failure();
                }
            }
        }

    };
}());
