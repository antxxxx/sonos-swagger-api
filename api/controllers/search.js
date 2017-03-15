'use strict';
const log4js = require('log4js');
const logger = log4js.getLogger('search.js');
const searchHelper = require('../helpers/search');
const commonFunctions = require('../helpers/commonFunctions');
const zones = require('../helpers/zones');

function search(ctx, next) {
    const discovery = ctx.request.discovery;
    const settings = ctx.request.settings;
    const service = ctx.request.swagger.params.service.value;
    const type = ctx.request.swagger.params.type.value;
    const query = ctx.request.swagger.params.q.value;
    const offset = ctx.request.swagger.params.offset.value;
    const limit = ctx.request.swagger.params.limit.value;

    zones.areZonesDiscovered(discovery)
        .then(() => {
            const player = discovery.getAnyPlayer();

            return searchHelper.search(player, service, type, query, offset, limit, settings);
        })
        .then((results) => {
            return commonFunctions.sendResponse(ctx, 200, results, next);
        })
        .catch((error) => {
            logger.error(error);

            return commonFunctions.errorHandler(ctx, error, next);
        });
}

module.exports = {
    search
};
