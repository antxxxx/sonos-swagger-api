'use strict';
const commonFunctions = require('./commonFunctions');
const debug = require('debug')('helpers:seek');
const Promise = require('bluebird');


function timeSeek(player, seconds, timeout) {
    let trackChanged;
    let changeStateResult;
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

            return player.coordinator.timeSeek(seconds);
        })
        .then((result) => {
            debug('waiting for state change');
            changeStateResult = result;

            return new Promise((resolve) => {
                trackChanged = resolve;
            });
        })
        .timeout(promiseTimeout)
        .then(() => {
            return commonFunctions.checkReturnStatus(changeStateResult);
        })
        .catch(Promise.TimeoutError, (error) => {
            debug(`got error ${commonFunctions.returnFullObject(error)}`);
            throw new Error(`timeout waiting for state change : ${error}`);
        })
        .catch((error) => {
            debug(`error in timeSeek() :  ${commonFunctions.returnFullObject(error)}`);
            throw error;
        })
        .finally(() => {
            player.removeListener('transport-state', onTransportStateChange);
        });
}

function trackSeek(player, track, timeout) {
    let trackChanged;
    let changeStateResult;
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

            return player.coordinator.trackSeek(track);
        })
        .tap((result) => {
            debug('waiting for state change');
            changeStateResult = result;

            return new Promise((resolve) => {
                trackChanged = resolve;
            });
        })
        .timeout(promiseTimeout)
        .then(() => {
            return commonFunctions.checkReturnStatus(changeStateResult);
        })
        .catch(Promise.TimeoutError, (error) => {
            debug(`got error ${commonFunctions.returnFullObject(error)}`);
            throw new Error(`timeout waiting for state change : ${error}`);
        })
        .catch((error) => {
            if (error.message === 'already at requested status') {
                return true;
            }
            debug(`error in trackSeek() :  ${commonFunctions.returnFullObject(error)}`);
            throw error;
        })
        .finally(() => {
            player.removeListener('transport-state', onTransportStateChange);
        });
}


module.exports = {
    timeSeek,
    trackSeek
};
