'use strict';

const debug = require('debug')('swagger:json_error_handler');
const util = require('util');
const log4js = require('log4js');
const logger = log4js.getLogger('app.js');

/* eslint no-unused-vars: off, camelcase:off, no-mixed-operators: off*/
module.exports = function create(fittingDef, bagpipes) {
    return function error_handler(context, next) {
        if (!util.isError(context.error)) {
            return next();
        }

        const err = context.error;
        let log;
        let body;

        logger.error(util.inspect(context.error, false, null));

        if (!context.statusCode || context.statusCode < 400) {
            if (context.response && context.response.statusCode && context.response.statusCode >= 400) {
                context.statusCode = context.response.statusCode;
            } else if (err.statusCode && err.statusCode >= 400) {
                context.statusCode = err.statusCode;
                delete err.statusCode;
            } else {
                context.statusCode = 500;
            }
        }

        try {
            if (context.statusCode === 500 && !fittingDef.handle500Errors) {
                return next(err);
            }

            context.headers['Content-Type'] = 'application/json';
            Object.defineProperty(err, 'message', {
                enumerable: true
            });
            if (fittingDef.includeErrStack) {
                Object.defineProperty(err, 'stack', {
                    enumerable: true
                });
            }

            delete context.error;

            return next(null, JSON.stringify(err));
        } catch (err2) {
            log = context.request && (
                    context.request.log || context.request.app && context.request.app.log
                  ) || context.response && context.response.log;

            body = {
                message: 'unable to stringify error properly',
                stringifyErr: err2.message,
                originalErrInspect: util.inspect(err)
            };
            context.statusCode = 500;

            debug('jsonErrorHandler unable to stringify error: ', err);
            if (log) {
                log.error(err2, 'onError: json_error_handler - unable to stringify error', err);
            }

            return next(null, JSON.stringify(body));
        }
    };
};
