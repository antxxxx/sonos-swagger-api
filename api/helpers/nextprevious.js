'use strict';
const commonFunctions = require('./commonFunctions');
const state = require('./state');
const Promise = require('bluebird');
const debug = require('debug')('helpers:nextPrevious');

function next(player, timeout) {
    let trackChanged;
    const promiseTimeout = timeout || 20000;

    function onTransportStateChange(status) {
        debug(`status changed in onTransportStateChange ${commonFunctions.returnFullObject(status)}`);
        if (trackChanged instanceof Function) {
            trackChanged();
        }
    }

    return Promise.resolve()
        .then(() => {
            return state.getPlayerState(player);
        })
        .then((currentState) => {
            if (commonFunctions.isRadioOrLineIn(currentState.currentTrack.uri)) {
                throw new Error('cant skip to next in current state');
            }
            player.on('transport-state', onTransportStateChange);
            debug('calling player.coordinator.nextTrack()');

            return player.coordinator.nextTrack();
        })
        .then(() => {
            return new Promise((resolve) => {
                trackChanged = resolve;
            });
        })
        .timeout(promiseTimeout)
        .catch(Promise.TimeoutError, (error) => {
            debug(`got error ${commonFunctions.returnFullObject(error)}`);
            throw new Error(`timeout waiting for state change : ${error}`);
        })
        .catch((error) => {
            debug(`error in next() :  ${commonFunctions.returnFullObject(error)}`);
            throw error;
        })
        .finally(() => {
            player.removeListener('transport-state', onTransportStateChange);
        });
}

function previous(player, timeout) {
    let trackChanged;
    const promiseTimeout = timeout || 20000;

    function onTransportStateChange(status) {
        debug(`status changed in onTransportStateChange ${commonFunctions.returnFullObject(status)}`);
        if (trackChanged instanceof Function) {
            trackChanged();
        }
    }

    return Promise.resolve()
        .then(() => {
            return state.getPlayerState(player);
        })
        .then((currentState) => {
            if (commonFunctions.isRadioOrLineIn(currentState.currentTrack.uri)) {
                throw new Error('cant skip to previous in current state');
            }
            player.on('transport-state', onTransportStateChange);
            debug('calling player.coordinator.previousTrack()');

            return player.coordinator.previousTrack();
        })
        .then(() => {
            return new Promise((resolve) => {
                trackChanged = resolve;
            });
        })
        .timeout(promiseTimeout)
        .catch(Promise.TimeoutError, (error) => {
            debug(`got error ${commonFunctions.returnFullObject(error)}`);
            throw new Error(`timeout waiting for state change : ${error}`);
        })
        .catch((error) => {
            debug(`error in previous() :  ${commonFunctions.returnFullObject(error)}`);
            throw error;
        })
        .finally(() => {
            player.removeListener('transport-state', onTransportStateChange);
        });
}

module.exports = {
    next,
    previous
};
