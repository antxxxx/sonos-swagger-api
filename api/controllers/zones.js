'use strict';
const log4js = require('log4js');
const logger = log4js.getLogger('zones.js');
const zones = require('../helpers/zones');
const commonFunctions = require('../helpers/commonFunctions');

function getZones(ctx, next) {
    const discovery = ctx.request.discovery;

    zones.areZonesDiscovered(discovery)
        .then(() => {
            return zones.getZones(discovery);
        })
        .then((results) => {
            return commonFunctions.sendResponse(ctx, 200, results, next);
        })
        .catch((error) => {
            logger.error(error);

            return commonFunctions.errorHandler(ctx, error, next);
        });
}

function getZone(ctx, next) {
    const discovery = ctx.request.discovery;
    const zoneName = ctx.request.swagger.params.zoneName.value;

    zones.areZonesDiscovered(discovery)
        .then(() => {
            return zones.isValidZone(discovery, zoneName);
        })
        .then((isValidZone) => {
            if (!isValidZone) {
                throw new Error('zone not found');
            }

            return zones.getZone(discovery, zoneName);
        })
        .then((results) => {
            return commonFunctions.sendResponse(ctx, 200, results, next);
        })
        .catch((error) => {
            logger.error(error);
            if (error.message === 'zone not found') {
                const response = {
                    code: 'zone.not.found',
                    message: `cant find zone ${zoneName}`
                };

                return commonFunctions.sendResponse(ctx, 404, response, next);
            }

            return commonFunctions.errorHandler(ctx, error, next);
        });
}

module.exports = {
    getZone,
    getZones
};
