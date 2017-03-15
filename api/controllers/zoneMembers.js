const log4js = require('log4js');
const logger = log4js.getLogger('zoneDetail.js');
const zones = require('../helpers/zones');
const players = require('../helpers/players');
const commonFunctions = require('../helpers/commonFunctions');

function getZoneMembers(ctx, next) {
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
            return commonFunctions.sendResponse(ctx, 200, results.members, next);
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

function addZoneMember(ctx, next) {
    logger.debug(`params ${commonFunctions.returnFullObject(ctx.request.swagger.params.body.value)}`);
    const discovery = ctx.request.discovery;
    const zoneName = ctx.request.swagger.params.zoneName.value;
    const playerName = ctx.request.swagger.params.body.value.player;
    const async = ctx.request.swagger.params.async.value;

    if (async) {
        const response = {
            message: 'OK'
        };

        commonFunctions.sendResponse(ctx, 202, response, next);
    }
    zones.areZonesDiscovered(discovery)
        .then(() => {
            return zones.isValidZone(discovery, zoneName);
        })
        .then((isValidZone) => {
            if (!isValidZone) {
                throw new Error('zone not found');
            }

            return players.isValidPlayer(discovery, playerName);
        })
        .then((isValidPlayer) => {
            if (!isValidPlayer) {
                throw new Error('player not found');
            }

            const zone = discovery.getPlayer(zoneName);
            const player = discovery.getPlayer(playerName);

            return zones.addMemberToZone(discovery, zone, player);
        })
        .then(() => {
            return zones.getZone(discovery, zoneName);
        })
        .then((results) => {
            return commonFunctions.sendResponse(ctx, 201, results.members, next, async);
        })
        .catch((error) => {
            logger.error(error);
            if (error.message === 'zone not found') {
                commonFunctions.createResponse(ctx, 404);
                const response = {
                    code: 'zone.not.found',
                    message: `cant find zone ${zoneName}`
                };

                return commonFunctions.sendResponse(ctx, 404, response, next, async);
            }

            return commonFunctions.errorHandler(ctx, error, next);
        });
}

function removeZoneMember(ctx, next) {
    const discovery = ctx.request.discovery;
    const zoneName = ctx.request.swagger.params.zoneName.value;
    const playerName = ctx.request.swagger.params.roomName.value;
    const async = ctx.request.swagger.params.async.value;

    if (async) {
        const response = {
            message: 'OK'
        };

        commonFunctions.sendResponse(ctx, 202, response, next);
    }
    zones.areZonesDiscovered(discovery)
        .then(() => {
            return zones.isValidZone(discovery, zoneName);
        })
        .then((isValidZone) => {
            if (!isValidZone) {
                throw new Error('zone not found');
            }

            return players.isValidPlayer(discovery, playerName);
        })
        .then((isValidPlayer) => {
            if (!isValidPlayer) {
                throw new Error('player not found');
            }
            if (zoneName === playerName) {
                throw new Error('cant remove a player from its own zone');
            }

            const zone = discovery.getPlayer(zoneName);
            const player = discovery.getPlayer(playerName);

            return zones.removeMemberFromZone(discovery, zone, player);
        })
        .then(() => {
            return zones.getZone(discovery, zoneName);
        })
        .then((results) => {
            return commonFunctions.sendResponse(ctx, 200, results.members, next, async);
        })
        .catch((error) => {
            logger.error(error);
            if (error.message === 'zone not found') {
                const response = {
                    code: 'zone.not.found',
                    message: `cant find zone ${zoneName}`
                };

                return commonFunctions.sendResponse(ctx, 404, response, next, async);
            }

            return commonFunctions.errorHandler(ctx, error, next);
        });
}

module.exports = {
    addZoneMember,
    getZoneMembers,
    removeZoneMember
};
