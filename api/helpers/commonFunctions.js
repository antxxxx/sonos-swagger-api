'use strict';
const util = require('util');


function sendResponse(ctx, statusCode, response, next, async) {
    if (async) {
        return true;
    }
    ctx.headers = {
        'Content-Type': 'application/json'
    };
    ctx.statusCode = statusCode;

    return next(null, response);
}
function errorHandler(ctx, error, next, async) {
    const response = {
        message: error.message,
        stack: error.stack,
        code: 'error'
    };

    sendResponse(ctx, 500, response, next, async);
}

function checkReturnStatus(status) {
    return Promise.resolve()
        .then(() => {
            if (status.statusCode === 200 && status.statusMessage === 'OK') {
                return;
            }
            throw new Error(`bad response : ${status.statusMessage}`);
        });
}

function returnFullObject(object) {
    return util.inspect(object, false, null);
}

function isRadioOrLineIn(uri) {
    return uri.startsWith('x-sonosapi-stream:') ||
      uri.startsWith('x-sonosapi-radio:') ||
      uri.startsWith('pndrradio:') ||
      uri.startsWith('x-sonosapi-hls:') ||
      uri.startsWith('x-rincon-stream:') ||
      uri.startsWith('x-sonos-htastream:') ||
      uri.startsWith('x-sonosprog-http:') ||
      uri.startsWith('x-rincon-mp3radio:');
}

const types = {
    array: '[object Array]',
    boolean: '[object Boolean]',
    get: (prop) => {
        return Object.prototype.toString.call(prop);
    },
    number: '[object Number]',
    object: '[object Object]',
    string: '[object String]'
};

module.exports = {
    checkReturnStatus,
    sendResponse,
    errorHandler,
    isRadioOrLineIn,
    returnFullObject,
    types
};
