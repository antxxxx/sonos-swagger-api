'use strict';
const log4js = require('log4js');
const logger = log4js.getLogger('players.js');
const players = require('../helpers/players');
const commonFunctions = require('../helpers/commonFunctions');
const zones = require('../helpers/zones');

function getPlayers(ctx, next) {
    const discovery = ctx.request.discovery;

    zones.areZonesDiscovered(discovery)
        .then(() => {
            return players.getPlayers(discovery);
        })
        .then((results) => {
            return commonFunctions.sendResponse(ctx, 200, results, next);
        })
        .catch((error) => {
            logger.error(error);
            commonFunctions.errorHandler(ctx, error, next);
        });
}

function getPlayer(ctx, next) {
    const discovery = ctx.request.discovery;
    const playerName = ctx.request.swagger.params.playerName.value;

    zones.areZonesDiscovered(discovery)
        .then(() => {
            return players.isValidPlayer(discovery, playerName);
        })
        .then((isValidPlayer) => {
            if (!isValidPlayer) {
                throw new Error('player not found');
            }

            return players.getPlayer(discovery, playerName);
        })
        .then((results) => {
            return commonFunctions.sendResponse(ctx, 200, results, next);
        })
        .catch((error) => {
            logger.error(error);
            if (error.message === 'player not found') {
                const response = {
                    code: 'player.not.found',
                    message: `cant find player ${playerName}`
                };

                return commonFunctions.sendResponse(ctx, 404, response, next);
            }

            return commonFunctions.errorHandler(ctx, error, next);
        });
}

module.exports = {
    getPlayer,
    getPlayers
};
