'use strict';
const commonFunctions = require('./commonFunctions');
const debug = require('debug')('helpers:volume');
const Promise = require('bluebird');

function setVolume(player, requestedVolume, timeout) {
    let muteChanged;
    const promiseTimeout = timeout || 20000;

    function onVolumeChange(status) {
        debug(`volume status changed in onVolumeChange ${commonFunctions.returnFullObject(status)}`);
        muteChanged();
    }

    return Promise.resolve()
        .then(() => {
            player.on('volume-change', onVolumeChange);

            return player.setVolume(requestedVolume);
        })
        .then(() => {
            debug('got return status - waiting for onMuteChange');

            return new Promise((resolve) => {
                muteChanged = resolve;
            });
        })
        .timeout(promiseTimeout)
        .catch(Promise.TimeoutError, (error) => {
            debug(`got error ${commonFunctions.returnFullObject(error)}`);
            throw new Error(`timeout waiting for state change : ${error}`);
        })
        .catch((error) => {
            debug(`got error ${commonFunctions.returnFullObject(error)}`);
            throw error;
        })
        .finally(() => {
            player.removeListener('volume-change', onVolumeChange);
        });
}


function setGroupVolume(player, requestedVolume, timeout) {
    let muteChanged;
    const promiseTimeout = timeout || 20000;

    function onVolumeChange(status) {
        debug(`volume status changed in onVolumeChange ${commonFunctions.returnFullObject(status)}`);
        muteChanged();
    }

    return Promise.resolve()
        .then(() => {
            player.on('group-volume', onVolumeChange);

            return player.coordinator.setGroupVolume(requestedVolume);
        })
        .then(() => {
            debug('got return status - waiting for onMuteChange');

            return new Promise((resolve) => {
                muteChanged = resolve;
            });
        })
        .timeout(promiseTimeout)
        .catch(Promise.TimeoutError, (error) => {
            debug(`got error ${commonFunctions.returnFullObject(error)}`);
            throw new Error(`timeout waiting for state change : ${error}`);
        })
        .catch((error) => {
            debug(`got error ${commonFunctions.returnFullObject(error)}`);
            throw error;
        })
        .finally(() => {
            player.removeListener('group-volume', onVolumeChange);
        });
}

module.exports = {
    setGroupVolume,
    setVolume
};
