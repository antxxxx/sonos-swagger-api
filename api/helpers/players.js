'use strict';

const commonFunctions = require('./commonFunctions');
const debug = require('debug')('helpers:players');
const Promise = require('bluebird');
const state = require('./state');
const _ = require('lodash');

function isValidPlayer(discovery, playerName) {
    return Promise.resolve()
        .then(() => {
            if (discovery.zones.length === 0) {
                throw new Error('No system has yet been discovered');
            }

            return;
        })
        .then(() => {
            const player = discovery.getPlayer(playerName);

            if (typeof player === 'undefined') {
                return false;
            }

            return true;
        });
}


function getPlayers(discovery) {
    return Promise.resolve()
    .then(() => {
        if (discovery.zones.length === 0) {
            throw new Error('No system has yet been discovered');
        }

        return;
    })
    .then(() => {
        const player = discovery.getAnyPlayer();

        return player.system.zones;
    })
    .then((returnedZones) => {
        const rooms = _.map(returnedZones, (value) => {
            return value.members;
        });

        return _.flatten(rooms);
    })
    .then((rooms) => {
        return Promise.all(_.map(rooms, (room) => {
            return state.simplifyPlayer(room);
        }));
    })
    .catch((error) => {
        debug(`error in getPlayers() : ${commonFunctions.returnFullObject(error)}`);

        throw error;
    });
}

function getPlayer(discovery, playerName) {
    let player;

    return Promise.resolve()
    .then(() => {
        if (discovery.zones.length === 0) {
            throw new Error('No system has yet been discovered');
        }

        return;
    })
    .then(() => {
        return isValidPlayer(discovery, playerName);
    })
    .then((isValidPlayerResult) => {
        if (!isValidPlayerResult) {
            throw new Error(`${playerName} is not a valid player`);
        }
        player = discovery.getPlayer(playerName);

        return state.simplifyPlayer(player);
    })
    .catch((error) => {
        debug(`error in getPlayers() : ${commonFunctions.returnFullObject(error)}`);

        throw error;
    });
}

module.exports = {
    getPlayer,
    getPlayers,
    isValidPlayer
};
