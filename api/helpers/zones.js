'use strict';

const commonFunctions = require('./commonFunctions');
const state = require('./state');
const debug = require('debug')('helpers:zones');
const Promise = require('bluebird');
const _ = require('lodash');


function rinconUri(player) {
    return `x-rincon:${player.uuid}`;
}

function getZones(discovery) {
    return Promise.resolve()
        .then(() => {
            if (discovery.zones.length === 0) {
                throw new Error('No system has yet been discovered');
            }

            return;
        })
        .then(() => {
            const player = discovery.getAnyPlayer();

            return Promise.all(_.map(player.system.zones, (zone) => {
                return state.simplifyZone(zone);
            }));
        })
        .catch((error) => {
            debug(`error in getZones() : ${commonFunctions.returnFullObject(error)}`);

            throw error;
        });
}

function isMemberOfZone(zone, player) {
    const thisZone = _.find(zone.system.zones, (searchZone) => {
        return searchZone.coordinator.roomName === zone.roomName;
    });

    return _.some(thisZone.members, (room) => {
        return room.roomName === player.roomName;
    });
}

function addMemberToZone(discovery, zone, player, timeout) {
    let trackChanged;
    const promiseTimeout = timeout || 30000;

    function onTransportStateChange(newState) {
        _.forEach(newState, (individualState) => {
            if (individualState.coordinator.roomName === zone.roomName &&
            trackChanged instanceof Function &&
            isMemberOfZone(zone, player)) {
                trackChanged();
            }
        });
    }

    if (isMemberOfZone(zone, player)) {
        debug(`${player.roomName} is already a member of ${zone.roomName}`);

        return Promise.resolve();
    }

    discovery.on('topology-change', onTransportStateChange);

    return Promise.resolve()
        .then(() => {
            debug('about to add player to zone');

            return player.setAVTransport(rinconUri(zone));
        })
        .then(() => {
            debug('waiting for state change');

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
            debug(`error in addMemberToZone() : ${commonFunctions.returnFullObject(error)}`);

            throw error;
        })
        .finally(() => {
            discovery.removeListener('topology-change', onTransportStateChange);
        });
}

function removeMemberFromZone(discovery, zone, player, timeout) {
    let trackChanged;
    const promiseTimeout = timeout || 20000;

    function onTransportStateChange(newState) {
        _.forEach(newState, (individualState) => {
            if (individualState.coordinator.roomName === zone.roomName &&
            trackChanged instanceof Function &&
            !isMemberOfZone(zone, player)) {
                trackChanged();
            }
        });
    }

    if (!isMemberOfZone(zone, player)) {
        debug(`${player.roomName} is not a member of ${zone.roomName}`);

        return Promise.resolve();
    }

    return Promise.resolve()
        .then(() => {
            discovery.on('topology-change', onTransportStateChange);
            debug('about to remove player from group');

            return player.becomeCoordinatorOfStandaloneGroup();
        })
        .then(() => {
            debug('waiting for state change');

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
            debug(`error in removeMemberFromZone() : ${commonFunctions.returnFullObject(error)}`);

            throw error;
        })
        .finally(() => {
            discovery.removeListener('topology-change', onTransportStateChange);
        });
}

function isValidZone(discovery, zoneName) {
    let player;

    return Promise.resolve()
        .then(() => {
            if (discovery.zones.length === 0) {
                throw new Error('No system has yet been discovered');
            }

            return;
        })
        .then(() => {
            player = discovery.getAnyPlayer();
            const zoneNames = _.map(player.system.zones, (zone) => {
                return zone.coordinator.roomName.toLowerCase();
            });

            return zoneNames.indexOf(zoneName.toLowerCase()) > -1;
        })
        .catch((error) => {
            debug(`error in getZones() : ${commonFunctions.returnFullObject(error)}`);

            throw error;
        });
}

function getZone(discovery, zoneName) {
    const player = discovery.getAnyPlayer();

    return Promise.resolve()
        .then(() => {
            return _.find(player.system.zones, (zone) => {
                return zone.coordinator.roomName.toLowerCase() === zoneName.toLowerCase();
            });
        })
        .then((zone) => {
            return state.simplifyZone(zone);
        })
        .catch((error) => {
            debug(`error in getZones() : ${commonFunctions.returnFullObject(error)}`);

            throw error;
        });
}

function areZonesDiscovered(discovery) {
    return Promise.resolve()
        .then(() => {
            if (discovery.zones.length === 0) {
                throw new Error('No system has yet been discovered');
            }

            return;
        });
}
module.exports = {
    addMemberToZone,
    areZonesDiscovered,
    getZone,
    getZones,
    isValidZone,
    removeMemberFromZone
};
