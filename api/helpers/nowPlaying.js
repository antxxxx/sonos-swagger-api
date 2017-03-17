'use strict';
const commonFunctions = require('./commonFunctions');
const debug = require('debug')('helpers:nowPlaying');
const Promise = require('bluebird');
const _ = require('lodash');

function getNowPlaying(player) {
    return Promise.resolve()
        .then(() => {
            debug('getting player.state.currentTrack');
            const currentState = _.cloneDeep(player.state.currentTrack);

            currentState.uriMetadata = player.avTransportUriMetadata;
            currentState.avTransportUri = player.avTransportUri;

            return currentState;
        })
        .catch((error) => {
            debug(`got error ${commonFunctions.returnFullObject(error)}`);
            throw error;
        });
}

function setNowPlaying(player, uri, metadata, timeout) {
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
            player.on('transport-state', onTransportStateChange);
            debug('calling player.coordinator.setAVTransport()');

            return player.coordinator.setAVTransport(uri, metadata);
        })
        .then(() => {
            debug('waiting for state change');

            return new Promise((resolve) => {
                trackChanged = resolve;
            });
        })
        .timeout(promiseTimeout)
        .then(() => {
            return getNowPlaying(player);
        })
        .catch(Promise.TimeoutError, (error) => {
            debug(`got error ${commonFunctions.returnFullObject(error)}`);
            throw new Error(`timeout waiting for state change : ${error}`);
        })
        .catch((error) => {
            debug(`got error ${commonFunctions.returnFullObject(error)}`);
            throw error;
        })
        .finally(() => {
            player.removeListener('transport-state', onTransportStateChange);
        });
}

module.exports = {
    getNowPlaying,
    setNowPlaying
};
