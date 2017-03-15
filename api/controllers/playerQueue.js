'use strict';
const log4js = require('log4js');
const logger = log4js.getLogger('queue.js');
const queue = require('../helpers/queue');
const commonFunctions = require('../helpers/commonFunctions');
const zones = require('../helpers/zones');
const players = require('../helpers/players');


function addToPlayerQueue(ctx, next) {
    logger.debug(`params ${commonFunctions.returnFullObject(ctx.request.swagger.params.body.value)}`);
    const discovery = ctx.request.discovery;
    const playerName = ctx.request.swagger.params.playerName.value;
    const async = ctx.request.swagger.params.async.value;
    const uri = ctx.request.swagger.params.body.value.uri;
    const metadata = ctx.request.swagger.params.body.value.metadata;
    const enqueAsNext = ctx.request.swagger.params.body.value.enqueAsNext;
    const desiredFirstTrackNumberEnqueued = ctx.request.swagger.params.body.value.desiredFirstTrackNumberEnqueued;

    let player;

    if (async) {
        const response = {
            message: 'OK'
        };

        commonFunctions.sendResponse(ctx, 202, response, next);
    }
    zones.areZonesDiscovered(discovery)
        .then(() => {
            return players.isValidPlayer(discovery, playerName);
        })
        .then((isValidPlayer) => {
            if (!isValidPlayer) {
                throw new Error('player not found');
            }
            player = discovery.getPlayer(playerName);

            return queue.addToQueue(player, uri, metadata, enqueAsNext, desiredFirstTrackNumberEnqueued);
        })
        .then((results) => {
            return commonFunctions.sendResponse(ctx, 201, results, next, async);
        })
        .catch((error) => {
            logger.error(error);
            if (error.message === 'player not found') {
                const response = {
                    code: 'player.not.found',
                    message: `cant find player ${playerName}`
                };

                return commonFunctions.sendResponse(ctx, 404, response, next, async);
            }

            return commonFunctions.errorHandler(ctx, error, next, async);
        });
}

function replacePlayerQueue(ctx, next) {
    logger.debug(`params ${commonFunctions.returnFullObject(ctx.request.swagger.params.body.value)}`);
    const discovery = ctx.request.discovery;
    const playerName = ctx.request.swagger.params.playerName.value;
    const async = ctx.request.swagger.params.async.value;
    const uri = ctx.request.swagger.params.body.value.uri;
    const metadata = ctx.request.swagger.params.body.value.metadata;
    const enqueAsNext = ctx.request.swagger.params.body.value.enqueAsNext;
    const desiredFirstTrackNumberEnqueued = ctx.request.swagger.params.body.value.desiredFirstTrackNumberEnqueued;
    let player;

    if (async) {
        const response = {
            message: 'OK'
        };

        commonFunctions.sendResponse(ctx, 202, response, next);
    }
    zones.areZonesDiscovered(discovery)
        .then(() => {
            return players.isValidPlayer(discovery, playerName);
        })
        .then((isValidPlayer) => {
            if (!isValidPlayer) {
                throw new Error('player not found');
            }
            player = discovery.getPlayer(playerName);

            return queue.replaceQueue(player, uri, metadata, enqueAsNext, desiredFirstTrackNumberEnqueued);
        })
        .then((results) => {
            return commonFunctions.sendResponse(ctx, 200, results, next, async);
        })
        .catch((error) => {
            logger.error(error);
            if (error.message === 'player not found') {
                const response = {
                    code: 'player.not.found',
                    message: `cant find player ${playerName}`
                };

                return commonFunctions.sendResponse(ctx, 404, response, next, async);
            }

            return commonFunctions.errorHandler(ctx, error, next, async);
        });
}

function clearPlayerQueue(ctx, next) {
    const discovery = ctx.request.discovery;
    const playerName = ctx.request.swagger.params.playerName.value;
    const async = ctx.request.swagger.params.async.value;
    let player;

    if (async) {
        const response = {
            message: 'OK'
        };

        commonFunctions.sendResponse(ctx, 202, response, next);
    }
    zones.areZonesDiscovered(discovery)
        .then(() => {
            return players.isValidPlayer(discovery, playerName);
        })
        .then((isValidPlayer) => {
            if (!isValidPlayer) {
                throw new Error('player not found');
            }
            player = discovery.getPlayer(playerName);

            return queue.clearQueue(player);
        })
        .then(() => {
            const response = {
                message: 'OK'
            };

            return commonFunctions.sendResponse(ctx, 200, response, next, async);
        })
        .catch((error) => {
            logger.error(error);
            if (error.message === 'player not found') {
                const response = {
                    code: 'player.not.found',
                    message: `cant find player ${playerName}`
                };

                return commonFunctions.sendResponse(ctx, 404, response, next, async);
            }

            return commonFunctions.errorHandler(ctx, error, next, async);
        });
}

function getPlayerQueue(ctx, next) {
    const discovery = ctx.request.discovery;
    const playerName = ctx.request.swagger.params.playerName.value;
    const detailed = ctx.request.swagger.params.detailed.value;
    let player;

    zones.areZonesDiscovered(discovery)
        .then(() => {
            return players.isValidPlayer(discovery, playerName);
        })
        .then((isValidPlayer) => {
            if (!isValidPlayer) {
                throw new Error('player not found');
            }
            player = discovery.getPlayer(playerName);

            return queue.getQueue(player, detailed);
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
    addToPlayerQueue,
    clearPlayerQueue,
    getPlayerQueue,
    replacePlayerQueue
};
