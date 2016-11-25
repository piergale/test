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
/*global window, Alarm, app */

/**
 * Model class constructor.
 *
 * @public
 * @constructor
 */
var Model = function Model() {
    'use strict';

    return;
};

(function strict() { // strict mode wrapper
    'use strict';

    Model.prototype = {

        /**
         * Initializes model instance of the model.
         *
         * @public
         * @param {App} app
         */
        init: function Model_init(app) {
            var exercises = window.localStorage.getItem('exercises');

            this.app = app;
            this.exercises = exercises ? JSON.parse(exercises) : [];
            this.alarmHelper = new Alarm();
        },

        /**
         * Adds new exercise, saves it in the local storage and sets new alarm.
         * Returns exercise object.
         *
         * @public
         * @param {object} exercise Exercise object
         * @returns {object|undefined} Exercise object.
         */
        add: function Model_saveAlarm(exercise) {
            var alarmId = this.alarmHelper.add(exercise);

            if (alarmId) {
                exercise.id = alarmId;

                // add to session storage
                this.exercises.push(exercise);

                // add to localStorage
                this.updateStorage();
                return exercise;
            }
        },

        /**
         * Removes exercise with a given id.
         * Returns true if exercise was successfully removed, false otherwise.
         *
         * @public
         * @param {string} exerciseId
         * @returns {boolean} True if exercise was successfully removed,
         * false otherwise.
         */
        remove: function Model_remove(exerciseId) {
            // find exercise to remove
            var exercise = this.find('id', exerciseId)[0],
                index = 0;

            // if exercise remove connected alarm
            if (exercise) {
                if (this.alarmHelper.remove(exercise)) {
                    // if alarm removed update session store
                    index = this.exercises.indexOf(exercise);
                    this.exercises.splice(index, 1);
                    // update localStorage
                    this.updateStorage();
                    return true;
                }
            }
            // error removing
            return false;
        },

        /**
         * Finds list of exercises matching values with given attribute name.
         * Returns list of exercises.
         *
         * @public
         * @param {String} attr Attribute name.
         * @param {*} value Attribute value.
         * @returns {object[]} List of exercises.
         */
        find: function Model_find(attr, value) {
            return this.exercises.filter(
                function filter(el) {
                    return el[attr] === value.toString();
                }
            );
        },

        /**
         * Saves exercises in the local storage.
         *
         * @private
         */
        updateStorage: function Model_updateStorage() {
            try {
                window.localStorage.setItem(
                    'exercises',
                    JSON.stringify(this.exercises)
                );
            } catch (e) {
                if (e.code === 22) {
                    // QuotaExceededError
                    app.ui.popup(
                        'Not enough memory to save data.' +
                            ' Please remove unnecessary files.'
                    );
                }
            }
        },

        /**
         * Returns array of all currently stored exercises.

         * @returns {object[]} List of exercises.
         */
        getAll: function Model_getAll() {
            return this.exercises;
        }

    };
}());
