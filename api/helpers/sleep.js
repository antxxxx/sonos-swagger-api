'use strict';
const commonFunctions = require('./commonFunctions');
const util = require('util');
const log4js = require('log4js');
const logger = log4js.getLogger('helpers/sleep.js');


function sleep(player, timestamp) {
    return Promise.resolve()
        .then(() => {
            if (/^\d+$/.test(timestamp) || timestamp.toLowerCase() === 'off') {
                return player.coordinator.sleep(timestamp);
            }
            // Broken input
            throw new Error(`bad timestamp : ${timestamp}`);
        })
        .then((result) => {
            return commonFunctions.checkReturnStatus(result);
        })
        .catch((err) => {
            logger.error(util.inspect(err, null, false));
            throw err;
        });
}

module.exports = {
    sleep
};
