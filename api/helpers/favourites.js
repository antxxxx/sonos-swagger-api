'use strict';

const commonFunctions = require('./commonFunctions');
const debug = require('debug')('helpers:favourite');
const Promise = require('bluebird');
const _ = require('lodash');

function getFavourites(player, detailed) {
    return Promise.resolve()
    .then(() => {
        debug('calling player.system.getFavorites()');

        return player.system.getFavorites();
    })
    .then((result) => {
        if (detailed) {
            return result;
        }

        return result.map((favourite) => {
            return {
                title: favourite.title
            };
        });
    })
    .catch((error) => {
        debug(`got error : ${commonFunctions.returnFullObject(error)}`);
        throw error;
    });
}

function getFavourite(player, favouriteToLookFor) {
    if (!favouriteToLookFor) {
        return false;
    }

    return Promise.resolve()
    .then(() => {
        debug('calling player.system.getFavorites()');

        return player.system.getFavorites();
    })
    .then((result) => {
        return _.find(result, (favourite) => {
            return favouriteToLookFor.toLowerCase() === favourite.title.toLowerCase();
        });
    })
    .catch((error) => {
        debug(`got error : ${commonFunctions.returnFullObject(error)}`);
        throw error;
    });
}
module.exports = {
    getFavourite,
    getFavourites
};
