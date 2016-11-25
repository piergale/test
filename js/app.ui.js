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

/*jslint devel: true, regexp: true*/
/*global $, app, document, history, TemplateManager, window, tau*/

/**
 * UI class constructor.
 *
 * @public
 * @constructor
 */
function Ui() {
    'use strict';

    return;
}

(function strict() { // strict mode wrapper
    'use strict';

    Ui.prototype = {

        /**
         * Template manager object.
         *
         * @public
         * @type {templateManager}
         */
        templateManager: null,

        /**
         * UI module initialization.
         *
         * @param {App} app
         * @param {number} exerciseId
         * @public
         */
        init: function UI_init(app, exerciseId) {
            this.app = app;
            this.currentExercise = (exerciseId !== undefined &&
                this.app.getExercise('id', exerciseId)) || null;
            this.templateManager = new TemplateManager();
            $(document).ready(this.domInit.bind(this));

            // init inner objects
            this.home.context = this;
            this.new_exercise.context = this;
            this.notification.context = this;
        },

        /**
         * When DOM is ready, initializes it.
         *
         * @private
         */
        domInit: function UI_domInit() {
            this.templateManager.loadToCache(
                [
                    'exercise',
                    'exerciseNotification'
                ],
                this.initPages.bind(this)
            );
            // Disable text selection
            $.mobile.tizen.disableSelection(document);
        },

        /**
         * Appends pages to the body and initializes them.
         *
         * @private
         */
        initPages: function UI_initPages() {

            this.home.init();
            this.new_exercise.init();
            this.notification.init();

            window.addEventListener('tizenhwkey', function onTizenHwKey(e) {
                var activePageId = tau.activePage.id;

                if (e.keyName === 'back') {
                    if (activePageId === 'home') {
                        app.exit();
                    } else if (activePageId === 'notification') {
                        app.exit();
                    } else if (activePageId === 'new_exercise') {
                        tau.changePage('#home');
                    } else {
                        history.back();
                    }
                }
            });

            $('input[type=checkbox]').change(function onChange() {
                $('#name').blur();
            });

            if (this.currentExercise) {
                // app run from alarm
                tau.changePage('#notification', 'pop', false, true);
            } else {
                tau.changePage('#home', 'pop', false, true);
            }
        },

        /**
         * Contains methods related to the home page.
         *
         * @public
         * @type {object}
         */
        home: {

            /**
             * Initializes home page.
             *
             * @public
             */
            init: function UI_home_init() {
                this.addEvents();
                this.beforeShow();
            },

            /**
             * Handles pagebeforeshow event on the home page.
             *
             * @private
             */
            beforeShow: function beforeShow() {
                var self = this;

                this.displayList();
                $('.removeExercise').on('click', function onClick() {
                    var exerciseId = $(this).data('exerciseid');
                    app.ui.popup('Are you sure?', {
                        'No': function onClickedNo() {
                            $('#popup').popup('close');
                        },
                        'Yes': function onClickedYes() {
                            self.context.app.removeExercise(
                                exerciseId,
                                self.removeElement.bind(self, exerciseId)
                            );
                            $('#popup').popup('close');
                        }
                    });
                });
            },

            /**
             * Binds events to the home page.
             *
             * @public
             */
            addEvents: function addEvents() {
                $('#home').on('pagebeforeshow', this.beforeShow.bind(this));
            },

            /**
             * Removes exercise from list.
             *
             * @private
             * @param {number} exerciseId ExerciseId of the element to remove.
             */
            removeElement: function removeElement(exerciseId) {
                var i = 0,
                    data = 0,
                    alarmList = document.getElementById('alarms_list'),
                    alarms = alarmList.children;

                for (i = 0; i < alarms.length; i += 1) {
                    data = alarms[i].getAttribute('data-exerciseid');
                    if (parseInt(data, 10) === parseInt(exerciseId, 10)) {
                        alarmList.removeChild(alarms[i]);
                    }
                }
            },

            /**
             * Builds exercises HTML list and adds it to page.
             *
             * @private
             * @param {object[]} [exercises] Exercises list.
             */
            displayList: function displayList(exercises) {
                var len = 0,
                    list = '',
                    exercise = null,
                    alarmList = document.getElementById('alarms_list');

                exercises = exercises || this.context.app.getAllExercises();
                len = exercises.length - 1;
                while (len >= 0) {
                    exercise = $.extend({}, exercises[len]); // copy object
                    exercise.daysText = exercise.days.join(', ');
                    list += this.context.templateManager.get(
                        'exercise',
                        exercise
                    );
                    len -= 1;
                }
                alarmList.innerHTML = list;
                tau.engine.createWidgets(alarmList);
                tau.widget.Listview(alarmList).refresh();
            }

        },

        /**
         * Contains methods related to the new exercise page.
         *
         * @public
         * @type {object}
         */
        new_exercise: {

            /**
             * Initializes new exercise page.
             *
             * @public
             */
            init: function init() {
                this.addEvents();
            },

            /**
             * Binds events to new exercise page.
             *
             * @private
             */
            addEvents: function addEvents() {
                var numberOfChecked = 0,
                    isName = false,
                    toggleSaveButton = function toggleSaveButton() {
                        var $button = $('#add-exercise-btn');

                        if (numberOfChecked && isName) {
                            $button.removeClass('ui-disabled');
                        } else {
                            $button.addClass('ui-disabled');
                        }
                    };

                function padZero(number) {
                    number = number.toString();
                    if (number.length === 1) {
                        return '0' + number;
                    }
                    return number;
                }

                $('#new_exercise').on('pagebeforeshow', function beforeShow() {
                    var checked = false,
                        len = 0,
                        date = new Date(),
                        startTime = padZero(date.getHours()) + ':' +
                            padZero(date.getMinutes());

                    // clear everything
                    numberOfChecked = 0;
                    isName = false;
                    $('#name').val('');
                    $('#comment').val('');
                    $('#startTime').val(startTime);
                    checked = $('#newExerciseDays input:checkbox:checked');
                    len = checked.length - 1;
                    while (len >= 0) {
                        $(checked[len]).attr('checked', false);
                        len -= 1;
                    }
                    toggleSaveButton();
                });

                // bind buttons
                $('#add-exercise-btn').on('click', function onClick() {
                    var exercise = {},
                        days = [],
                        len = 0;

                    days = $('#newExerciseDays input:checkbox:checked');
                    len = days.length - 1;
                    exercise.days = [];
                    while (len >= 0) {
                        exercise.days.unshift($(days[len]).data('day'));
                        len -= 1;
                    }

                    exercise.name = $('#name').val().trim();
                    exercise.startTime = $('#startTime').val();
                    exercise.comment = $('#comment').val().trim();

                    this.app.addExercise(exercise, function goToHome() {
                        tau.changePage('#home');
                    });

                }.bind(this.context));

                $('#add-exercise-cancel-btn').on('click', function onClick() {
                    history.back();
                });

                $('#name').on('input', function onInput() {
                    isName = ($(this).val().trim().length > 0);
                    toggleSaveButton();
                });

                $('#newExerciseDays input[type=checkbox]')
                    .on('change', function onChange() {
                        numberOfChecked = $(
                            '#newExerciseDays input[type=checkbox]:checked'
                        ).size();
                        toggleSaveButton();
                    });
            }

        },

        /**
         * Contains methods related to the notification page.
         *
         * @public
         * @type {object}
         */
        notification: {

            /**
             * Initializes notification page.
             *
             * @public
             */
            init: function init() {
                this.addEvents();
            },

            /**
             * Binds events to notification page.
             *
             * @private
             */
            addEvents: function addEvents() {
                $('#notification').on('pagebeforeshow', function beforeShow() {
                    var exercise = null,
                        html = '';

                    // copy object
                    exercise = $.extend({}, this.context.currentExercise);
                    html = this.context.templateManager.get(
                        'exerciseNotification',
                        exercise
                    );
                    $('.notificationContainer').html(html);
                }.bind(this));

                $('.exit').on('click', function onClick() {
                    app.exit();
                });
            }

        }

    };

    /**
     * Creates and displays popup widget.
     *
     * @public
     * @param {string} text Text information.
     * @param {object} buttons Buttons template object.
     */
    Ui.prototype.popup = function showPopup(text, buttons) {
        var i = 0,
            popupNumber = Object.keys(buttons).length,
            popup = document.getElementById('popup'),
            popupButtons = $('#popupButtons'),
            popupText = document.getElementById('popupText'),
            tauPopup = tau.widget.Popup(popup),
            buttonsCount = 0;

        // if buttons template wasn't add, use default template
        if (!buttons) {
            buttons = {
                'OK': function ok() {
                    tauPopup.close();
                }
            };
        }

        // clear popup
        popupButtons.empty();

        popup.className = popup.className.replace(/\bcenter_basic.*?\b/g, '');
        popup.classList.add('center_basic_' + popupNumber + 'btn');

        // adds buttons to popup HTML element
        for (i in buttons) {
            if (buttons.hasOwnProperty(i)) {
                buttonsCount += 1;
                if (buttons[i]) {
                    $('<a/>').text(i).attr({
                        'data-inline': 'true'
                    }).addClass('ui-btn').bind('click', buttons[i]).appendTo(
                        popupButtons
                    );
                }
            }
        }
        if (buttonsCount === 2) {
            popupButtons.addClass('ui-grid-col-2');
        } else {
            popupButtons.removeClass('ui-grid-col-2');
        }
        // adds text to popup HTML element
        popupText.innerHTML = '<p>' + text + '</p>';

        tau.engine.createWidgets(popup);
        tau.widget.Popup(popup).open();
    };

}());
