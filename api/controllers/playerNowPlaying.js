'use strict';
const log4js = require('log4js');
const logger = log4js.getLogger('nowplaying.js');
const nowPlaying = require('../helpers/nowPlaying');
const playpause = require('../helpers/playpause');
const commonFunctions = require('../helpers/commonFunctions');
const zones = require('../helpers/zones');
const players = require('../helpers/players');

function getPlayerNowPlaying(ctx, next) {
    const discovery = ctx.request.discovery;
    const playerName = ctx.request.swagger.params.playerName.value;
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

            return nowPlaying.getNowPlaying(player);
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

function setPlayerNowPlaying(ctx, next) {
    logger.debug(`params ${commonFunctions.returnFullObject(ctx.request.swagger.params.body.value)}`);
    const discovery = ctx.request.discovery;
    const playerName = ctx.request.swagger.params.playerName.value;
    const async = ctx.request.swagger.params.async.value;
    const uri = ctx.request.swagger.params.body.value.uri;
    const metadata = ctx.request.swagger.params.body.value.metadata;
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

            return nowPlaying.setNowPlaying(player, uri, metadata);
        })
        .then(() => {
            return playpause.play(player);
        })
        .then(() => {
            return nowPlaying.getNowPlaying(player);
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

module.exports = {
    getPlayerNowPlaying,
    setPlayerNowPlaying
};
