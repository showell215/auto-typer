'use strict';

var CONFIG_OPTIONS = Object.freeze({
    behavior: {
        type: 'string',
        validOptions: ['alternate', 'write', 'delete'],
        default: 'alternate' 
    }, 
    cursor: {
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
        default: 5000
    }, 
    addDelay: {
        type: 'number',
        default: 1000
    }
});

function AutoTyper (options) {
    var that = this;
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
                that[optionName] = options[optionName];
            } else {
                console.warn('Invalid configuration option "' + optionName + '"');
            }
        });
    }

    return this;
}

AutoTyper.prototype = {
    logError: function (string) {
        console.error('[AutoTyper] [ERROR] ' + string);
    },
    init: function () {
        // find the target element and attach the strings passed in dataset to the instance
        this.targetElement = document.querySelector(this.targetSelector);
        this.stringsToType = this.targetElement.dataset.autoTyperText.split(',');

        if (!this.stringsToType || !Array.isArray(this.stringsToType) || !this.stringsToType.length) {
            this.logError('Target element must have a "data-typing-widget-text" attribute containing an array of strings')
            return;
        }

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
              that.currentIndex = ++that.currentIndex >= that.stringsToType.length ? 0 : that.currentIndex;
              setTimeout(that.removeWidgetText.bind(that), that.deleteDelay);
            }
        }, that.addInterval);
    },
    removeWidgetText: function () {
        var that = this;
          that.removeIntervalId = setInterval(function () {
          if (that.targetElement.textContent.length) {
            that.targetElement.textContent = that.targetElement.textContent.slice(0, -1);
          } else {
            clearInterval(that.removeIntervalId);
            setTimeout(that.addWidgetText.bind(that), that.addDelay);
          }
      }, that.deleteInterval)
    }
}

// add default options to prototype
Object.keys(CONFIG_OPTIONS).forEach(function (optionName) {
    AutoTyper.prototype[optionName] = CONFIG_OPTIONS[optionName].default;
});
