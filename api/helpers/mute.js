'use strict';

const commonFunctions = require('./commonFunctions');
const debug = require('debug')('helpers:mute');
const Promise = require('bluebird');
const state = require('./state');


function setMuteStatus(player, muteStatus, timeout) {
    let muteChanged;
    let changeStateResult;
    const promiseTimeout = timeout || 20000;

    function onMuteChange(status) {
        debug(`mute status changed in onMuteChange ${commonFunctions.returnFullObject(status)}`);
        if (muteChanged instanceof Function && status.previousMute !== status.newMute) {
            muteChanged();
        }
    }

    return Promise.resolve()
        .then(() => {
            return state.getPlayerState(player);
        })
        .then((currentState) => {
            if (currentState.mute === muteStatus) {
                debug('already at requested state so not doing anything');
                throw new Error('already at state');
            }
            player.on('mute-change', onMuteChange);
            if (muteStatus === 'mute on') {
                debug('calling player.mute');

                return player.mute();
            }
            if (muteStatus === 'mute off') {
                debug('calling player.unMute');

                return player.unMute();
            }

            throw new Error(`invalid mutestatus : ${muteStatus}`);
        })
        .then((result) => {
            debug('got return status - waiting for onMuteChange');
            changeStateResult = result;

            return new Promise((resolve) => {
                muteChanged = resolve;
            });
        })
        .timeout(promiseTimeout)
        .then(() => {
            debug('checking return status');

            return commonFunctions.checkReturnStatus(changeStateResult);
        })
        .catch(Promise.TimeoutError, (error) => {
            debug(`got error ${commonFunctions.returnFullObject(error)}`);
            throw new Error(`timeout waiting for state change : ${error}`);
        })
        .catch((error) => {
            if (error.message === 'already at state') {
                return;
            }
            debug(`got error ${commonFunctions.returnFullObject(error)}`);
            throw error;
        })
        .finally(() => {
            player.removeListener('mute-change', onMuteChange);
        });
}

function setGroupMuteStatus(player, muteStatus, timeout) {
    let muteChanged;
    let changeStateResult;
    const promiseTimeout = timeout || 20000;

    function onMuteChange(status) {
        debug(`mute status changed in onMuteChange ${commonFunctions.returnFullObject(status)}`);
        if (muteChanged instanceof Function && status.previousMute !== status.newMute) {
            muteChanged();
        }
    }

    return Promise.resolve()
        .then(() => {
            return state.simplifyPlayer(player);
        })
        .then((currentState) => {
            if (currentState.groupState.mute === muteStatus) {
                debug('already at requested state so not doing anything');
                throw new Error('already at state');
            }
            player.on('group-mute', onMuteChange);
            if (muteStatus === 'mute on') {
                debug('calling player.coordinator.mute');

                return player.coordinator.muteGroup();
            }
            if (muteStatus === 'mute off') {
                debug('calling player.coordinator.unMute');

                return player.coordinator.unMuteGroup();
            }

            throw new Error(`invalid mutestatus : ${muteStatus}`);
        })
        .then((result) => {
            debug('got return status - waiting for onMuteChange');
            changeStateResult = result;

            return new Promise((resolve) => {
                muteChanged = resolve;
            });
        })
        .timeout(promiseTimeout)
        .then(() => {
            debug('checking return status');

            return commonFunctions.checkReturnStatus(changeStateResult);
        })
        .catch(Promise.TimeoutError, (error) => {
            debug(`got error ${commonFunctions.returnFullObject(error)}`);
            throw new Error(`timeout waiting for state change : ${error}`);
        })
        .catch((error) => {
            if (error.message === 'already at state') {
                return;
            }
            debug(`got error ${commonFunctions.returnFullObject(error)}`);
            throw error;
        })
        .finally(() => {
            player.removeListener('group-mute', onMuteChange);
        });
}


module.exports = {
    setGroupMuteStatus,
    setMuteStatus
};
