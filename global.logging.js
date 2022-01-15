global.LOGGING_ENABLED = true;
global.logging = function (bool) {
    global.LOGGING_ENABLED = bool;
};
global.log = {
    log: function Log(arg) {
        if (global.LOGGING_ENABLED) return console.log(arg);
    },
    warn: function warn(arg) {
        if (global.LOGGING_ENABLED) return console.log("<span style=color:#FFBF3F>" + arg + "</span>");
    },
    err: function err(arg) {
        if (global.LOGGING_ENABLED) return console.log("<span style=color:#D18F98>" + arg + "</span>");
    },
    error: function error(arg) {
        if (global.LOGGING_ENABLED) return console.log("<span style=color:#D18F98>" + arg + "</span>");
    },
};
