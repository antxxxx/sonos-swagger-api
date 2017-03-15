'use strict';
const commonFunctions = require('./commonFunctions');
const Promise = require('bluebird');
const debug = require('debug')('helpers:playmode');
const state = require('./state');

function setRepeatStatus(player, requestedState, timeout) {
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
            if (requestedState !== 'all' && requestedState !== 'none' && requestedState !== 'one') {
                throw new Error(`invalid repeat status : ${requestedState}`);
            }
            debug('calling state.getPlayerState()');

            return state.getPlayerState(player);
        })
        .then((currentState) => {
            if (currentState.playMode.repeat === requestedState) {
                debug(`already at status ${requestedState} so exiting`);

                throw new Error('already at requested status');
            }
            player.on('transport-state', onTransportStateChange);
            debug(`calling player.coordinator.repeat(${requestedState})`);

            return player.coordinator.repeat(requestedState);
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
            if (error.message === 'already at requested status') {
                return true;
            }
            debug(`error in setRepeatStatus() :  ${commonFunctions.returnFullObject(error)}`);
            throw error;
        })
        .finally(() => {
            player.removeListener('transport-state', onTransportStateChange);
        });
}

function setShuffleStatus(player, requestedState, timeout) {
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
            if (requestedState !== 'shuffle on' && requestedState !== 'shuffle off') {
                throw new Error(`invalid shuffle status : ${requestedState}`);
            }

            return state.getPlayerState(player);
        })
        .then((currentState) => {
            if (currentState.playMode.shuffle === requestedState) {
                debug(`already at status ${requestedState} so exiting`);

                throw new Error('already at requested status');
            }
            player.on('transport-state', onTransportStateChange);
            if (requestedState === 'shuffle on') {
                debug('calling player.coordinator.shuffle(true)');

                return player.coordinator.shuffle(1);
            }
            debug('calling player.coordinator.shuffle(false)');

            return player.coordinator.shuffle(0);
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
            if (error.message === 'already at requested status') {
                return true;
            }
            debug(`error in setShuffleStatus() :  ${commonFunctions.returnFullObject(error)}`);
            throw error;
        })
        .finally(() => {
            player.removeListener('transport-state', onTransportStateChange);
        });
}

function setCrossfadeStatus(player, requestedState, timeout) {
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
            if (requestedState !== 'crossfade on' && requestedState !== 'crossfade off') {
                throw new Error(`invalid crossfade status : ${requestedState}`);
            }

            return state.getPlayerState(player);
        })
        .then((currentState) => {
            if (currentState.playMode.crossfade === requestedState) {
                debug(`already at status ${requestedState} so exiting`);

                throw new Error('already at requested status');
            }
            player.on('transport-state', onTransportStateChange);
            if (requestedState === 'crossfade on') {
                debug('calling player.coordinator.crossfade(true)');

                return player.coordinator.crossfade(1);
            }
            debug('calling player.coordinator.crossfade(false)');

            return player.coordinator.crossfade(0);
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
            if (error.message === 'already at requested status') {
                return true;
            }
            debug(`error in setCrossfadeStatus() :  ${commonFunctions.returnFullObject(error)}`);
            throw error;
        })
        .finally(() => {
            player.removeListener('transport-state', onTransportStateChange);
        });
}

module.exports = {
    setCrossfadeStatus,
    setRepeatStatus,
    setShuffleStatus
};
