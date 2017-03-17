'use strict';

const playPause = require('./playpause');
const commonFunctions = require('./commonFunctions');
const Promise = require('bluebird');
const favourites = require('../helpers/favourites');
const debug = require('debug')('helpers:favourite');

function playFavourite(player, requestedFavourite, timeout) {
    let trackChanged;
    const promiseTimeout = timeout || 30000;
    let sonosFavourite;

    function onTransportStateChange(status) {
        debug(`status changed in onTransportStateChange ${commonFunctions.returnFullObject(status)}`);
        if (trackChanged instanceof Function) {
            trackChanged();
        }
    }

    return Promise.resolve()
        .then(() => {
            return favourites.getFavourite(player, requestedFavourite);
        })
        .then((results) => {
            if (results) {
                sonosFavourite = results;
                debug('calling playPause.pause()');

                return playPause.pause(player);
            }
            throw new Error('favourite not found');
        })
        .then(() => {
            if (player.state.currentTrack.uri === sonosFavourite.uri) {
                debug('same stream as currently playing');

                return 'no stream change';
            }
            debug('calling player.coordinator.replaceWithFavorite()');
            player.on('transport-state', onTransportStateChange);

            return player.coordinator.replaceWithFavorite(requestedFavourite);
        })
        .then((result) => {
            if (result !== 'no stream change') {
                debug('waiting for state change');

                return new Promise((resolve) => {
                    trackChanged = resolve;
                });
            }

            return true;
        })
        .timeout(promiseTimeout)
        .then(() => {
            debug('calling playPause.play()');

            return playPause.play(player);
        })
        .catch(Promise.TimeoutError, (error) => {
            throw new Error(`timeout waiting for state change : ${error}`);
        })
        .catch((error) => {
            debug(`error in playFavourite() :  ${commonFunctions.returnFullObject(error)}`);
            throw error;
        })
        .finally(() => {
            player.removeListener('transport-state', onTransportStateChange);
        });
}

module.exports = {
    playFavourite
};
