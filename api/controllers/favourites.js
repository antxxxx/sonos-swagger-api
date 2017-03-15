'use strict';
const log4js = require('log4js');
const logger = log4js.getLogger('favourite.js');
const favourites = require('../helpers/favourites');
const commonFunctions = require('../helpers/commonFunctions');
const zones = require('../helpers/zones');

function getFavourites(ctx, next) {
    const discovery = ctx.request.discovery;
    const detailed = ctx.request.swagger.params.detailed.value;

    zones.areZonesDiscovered(discovery)
        .then(() => {
            const player = discovery.getAnyPlayer();

            return favourites.getFavourites(player, detailed);
        })
        .then((results) => {
            return commonFunctions.sendResponse(ctx, 200, results, next);
        })
        .catch((error) => {
            logger.error(error);

            return commonFunctions.errorHandler(ctx, error, next);
        });
}

function getFavourite(ctx, next) {
    const discovery = ctx.request.discovery;
    const favouriteToLookFor = ctx.request.swagger.params.favourite.value;

    zones.areZonesDiscovered(discovery)
        .then(() => {
            const player = discovery.getAnyPlayer();

            return favourites.getFavourite(player, favouriteToLookFor);
        })
        .then((results) => {
            if (results) {
                return commonFunctions.sendResponse(ctx, 200, results, next);
            }

            throw new Error('favourite not found');
        })
        .catch((error) => {
            logger.error(error);
            if (error.message === 'favourite not found') {
                const response = {
                    code: 'favourite.not.found',
                    message: `cant find favourite ${favouriteToLookFor}`
                };

                return commonFunctions.sendResponse(ctx, 404, response, next);
            }

            return commonFunctions.errorHandler(ctx, error, next);
        });
}

module.exports = {
    getFavourite,
    getFavourites
};
