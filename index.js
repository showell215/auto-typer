(function () {
    'use strict';

    var CONFIG_OPTIONS = Object.freeze({
        behavior: {
            type: 'string',
            validOptions: ['alternate', 'writeOnly'],
            default: 'alternate'
        },
        cursorOn: {
            type: 'boolean',
            default: true
        },
        targetSelector: {
            type: 'string',
            default: '#auto-typer-target'
        },
        deleteInterval: {
            type: 'number',
            default: 50
        },
        addInterval: {
            type: 'number',
            default: 50
        },
        deleteDelay: {
            type: 'number',
            default: 1000
        },
        addDelay: {
            type: 'number',
            default: 1000
        },
        delay: {
            type: 'number',
            default: 1000
        }
    });

    function AutoTyper (options) {
        var that = this;
        // set up instance-specific objects
        this.activeTimeouts = [];
        this.additionalElements = [];
        this.customOptions = {};
        // start at the first string in the array
        this.currentIndex = 0;

        // process options object if passed and set any valid options
        if (options && typeof options === 'object' && !Array.isArray(options)) {
            Object.keys(options).forEach(function (optionName) {
                var matchedConfigOption = CONFIG_OPTIONS[optionName];

                if (matchedConfigOption &&
                    typeof options[optionName] === matchedConfigOption.type &&
                    (!matchedConfigOption.validOptions ||
                    matchedConfigOption.validOptions &&
                    matchedConfigOption.validOptions.indexOf(options[optionName]) > -1)
                ) {
                    // this is a valid option, add it to this instance
                    that.customOptions[optionName] = options[optionName];
                    that[optionName] = options[optionName];
                } else {
                    console.warn('Invalid configuration option: "' + optionName + '"');
                }
            });
        }



        return this;
    }

    AutoTyper.prototype = {
        logError: function (string) {
            throw new Error('[AutoTyper] [ERROR] ' + string);
        },
        init: function () {
            // find the target element and attach the strings passed in dataset to the instance
            this.targetElement = document.querySelector(this.targetSelector);
            this.stringsToType = this.targetElement.dataset.autoTyperText.split(',');

            if (!this.stringsToType || !Array.isArray(this.stringsToType) || !this.stringsToType.length) {
                this.logError('Target element must have a "data-typing-widget-text" attribute containing an array of strings');

                return;
            }

            if (this.cursorOn) {
                this.addCursorElement();
            }
            // start typing
            this.addWidgetText();
        },
        addWidgetText: function () {
            var newString = this.stringsToType[this.currentIndex],
                i = 0,
                that = this;
            that.addIntervalId = setInterval(function () {
                if (i < newString.length) {
                    that.targetElement.textContent = that.targetElement.textContent + newString[i];
                    i += 1;
                } else {
                    clearInterval(that.addIntervalId);
                    that.currentIndex += 1;

                    switch (that.behavior) {
                        case 'alternate':
                            that.currentIndex = that.currentIndex >= that.stringsToType.length ? 0 : that.currentIndex;
                            that.activeTimeouts.push(setTimeout(that.removeWidgetText.bind(that), that.deleteDelay));
                            break;
                        case 'writeOnly':
                        // in write only mode, stop after typing all strings once
                            if (that.currentIndex < that.stringsToType.length) {
                                that.activeTimeouts.push(setTimeout(that.addWidgetText.bind(that), that.addDelay));
                            }
                            break;
                        default:
                            this.logError('Non-matching behavior: ' + that.behavior);
                    }
                }
            }, that.addInterval);
        },
        removeWidgetText: function (cb) {
            var that = this;
            that.removeIntervalId = setInterval(function () {
                if (that.targetElement.textContent.length) {
                    that.targetElement.textContent = that.targetElement.textContent.slice(0, -1);
                } else {
                    clearInterval(that.removeIntervalId);
                    that.activeTimeouts.push(setTimeout(that.addWidgetText.bind(that), that.addDelay));
                    // TODO how to clean up timeouts once they are run?
                }
            }, that.deleteInterval);
        },
        addCursorElement: function () {
            var baseFontSize = window.getComputedStyle(this.targetElement).getPropertyValue('font-size'),
                // cursor looks best about 1.2 times the font size
                cursorSize = parseFloat(baseFontSize.substring(0, baseFontSize.length - 2)) * 1.2 + 'px',
                cursorElement = document.createElement('span'),
                cursorStyleElement = document.createElement('style');

            cursorStyleElement.type = 'text/css';
            cursorStyleElement.appendChild(document.createTextNode(
                '.auto-typer-cursor {' +
                    'animation: cursor-blink steps(1) 400ms infinite alternate;' +
                    'font-size: ' + cursorSize + ';' +
                    'top: 2px;' +
                    'position: relative;' +
                    'color: gray;' +
                '}' +
                // cursor pseudo-element
                '.auto-typer-cursor::after { content: "|"; }' +
                // blink keyframes
                '@keyframes cursor-blink {' +
                    '0% { visibility: visible;}' +
                    '50% { visibility: hidden;}' +
                    '100% { visibility: visible;}' +
                '}'
            ));
            document.head.appendChild(cursorStyleElement);
            cursorElement.className = 'auto-typer-cursor';
            this.targetElement.parentNode.insertBefore(cursorElement, this.targetElement.nextSibling);
            this.additionalElements.push(cursorElement);
        },
        destroy: function () {
            // clear any timeouts that are active
            this.activeTimeouts.forEach(function (timeoutId) {
                clearTimeout(timeoutId);
            });
            // clear any intervals that are active
            clearInterval(this.addIntervalId);
            clearInterval(this.removeIntervalId);
            // remove cursor element and any others besides target
            this.additionalElements.forEach(function (el) {
                el.parentElement.removeChild(el);
            });
            // clear content of target element
            this.targetElement.innerHTML = null;
        }
    };

    // add default options to prototype
    Object.keys(CONFIG_OPTIONS).forEach(function (optionName) {
        AutoTyper.prototype[optionName] = CONFIG_OPTIONS[optionName].default;
    });

    window.AutoTyper = AutoTyper;
})();
