'use strict';
const log4js = require('log4js');
const logger = log4js.getLogger('queue.js');
const commonFunctions = require('../helpers/commonFunctions');
const zones = require('../helpers/zones');
const playerQueue = require('./playerQueue');
const _ = require('lodash');

function addToZoneQueue(ctx, next) {
    logger.debug(`params ${commonFunctions.returnFullObject(ctx.request.swagger.params.body.value)}`);
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
            _.set(ctx.request.swagger.params, 'playerName.value', zoneName);

            return playerQueue.addToPlayerQueue(ctx, next);
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

function replaceZoneQueue(ctx, next) {
    logger.debug(`params ${commonFunctions.returnFullObject(ctx.request.swagger.params.body.value)}`);
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
            _.set(ctx.request.swagger.params, 'playerName.value', zoneName);

            return playerQueue.replacePlayerQueue(ctx, next);
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

function clearZoneQueue(ctx, next) {
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
            _.set(ctx.request.swagger.params, 'playerName.value', zoneName);

            return playerQueue.clearPlayerQueue(ctx, next);
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

function getZoneQueue(ctx, next) {
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
            _.set(ctx.request.swagger.params, 'playerName.value', zoneName);

            return playerQueue.getPlayerQueue(ctx, next);
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
    addToZoneQueue,
    replaceZoneQueue,
    clearZoneQueue,
    getZoneQueue
};
