'use strict';

const SpotifyWebApi = require('spotify-web-api-node');
const _ = require('lodash');
const util = require('util');
const log4js = require('log4js');
const logger = log4js.getLogger('helpers/music_services/spotify.js');

const spotifyDef = {
    country: '&market=',
    metastart: {
        album: '0004206cspotify%3aalbum%3a',
        artist: '000c206cspotify%3aartistRadio%3a',
        song: '00032020spotify%3atrack%3a',
        artisttoptracks: '000e206cspotify%3aartistTopTracks%3a'
    },
    object: {
        album: 'container.album.musicAlbum',
        artist: 'item.audioItem.audioBroadcast.#artistRadio',
        song: 'item.audioItem.musicTrack',
        artisttoptracks: 'container.playlistContainer'
    },
    parent: {
        album: '00020000album:',
        artist: '00052064spotify%3aartist%3a',
        song: '00020000track:',
        artisttoptracks: '00052064spotify%3aartist%3a'
    }
};


let sid = '';
let serviceType = '';

function getURI(type, id) {
    const accountSN = '5';

    switch (type) {
        case 'album':
            return `x-rincon-cpcontainer:0004206cspotify%3aalbum%3a${id}`;
        case 'song':
            return `x-sonos-spotify:spotify%3atrack%3a${id}?sid=${sid}&flags=8224&sn=${accountSN}`;
        case 'artist':
            return `x-sonosapi-radio:spotify%3aartistRadio%3a${id}?sid=${sid}&flags=8300&sn=${accountSN}`;
        case 'artisttoptracks':
            return `x-rincon-cpcontainer:000e206cspotify%3aartistTopTracks%3a${id}`;
        default:
            throw new Error('URI type not defined in getURI');

    }
}

function getServiceToken() {
    return `SA_RINCON${serviceType}_X_#Svc${serviceType}-0-Token`;
}


function getMetadata(type, id, name, title) {
    const token = getServiceToken();
    const parentUri = spotifyDef.parent[type] + name;
    const objectType = spotifyDef.object[type];
    let metaTitle = title;

    if (type !== 'station') {
        metaTitle = `${title} radio`;
    }

    return `<DIDL-Lite xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:upnp="urn:schemas-upnp-org:metadata-1-0/upnp/"
          xmlns:r="urn:schemas-rinconnetworks-com:metadata-1-0/" xmlns="urn:schemas-upnp-org:metadata-1-0/DIDL-Lite/">
          <item id="${id}" parentID="${parentUri}" restricted="true"><dc:title>${metaTitle}</dc:title><upnp:class>object.${objectType}</upnp:class>
          <desc id="cdudn" nameSpace="urn:schemas-rinconnetworks-com:metadata-1-0/">${token}</desc></item></DIDL-Lite>`;
}

function getReturnResults(data, type) {
    const items = [];
    let itemsReturned = 0;
    let MetadataID = '';

    if (data.total > 0) {
        data.items.forEach((item) => {
            const itemResult = {};

            itemResult.title = item.name;
            if (type === 'song') {
                itemResult.artist = item.artists[0].name;
                itemResult.album = item.album.name;
                itemResult.imageUrl = item.album.images[0].url;
                itemResult.albumTrackNumber = item.track_number;
            }
            if (type === 'album') {
                itemResult.artist = item.artists[0].name;
                itemResult.album = item.name;
                itemResult.imageUrl = item.images[0].url;
            }
            if (type === 'artist') {
                itemResult.artist = item.name;
                itemResult.album = item.name;
                itemResult.imageUrl = _.get(item, 'images[0].url', '');
                itemResult.artistId = item.id;
            }
            if (type === 'artisttoptracks') {
                itemResult.artist = item.name;
                itemResult.album = item.name;
                itemResult.imageUrl = _.get(item, 'images[0].url', '');
                itemResult.artistId = item.id;
            }
            itemResult.type = type;
            itemResult.uri = getURI(type, encodeURIComponent(item.id));
            MetadataID = spotifyDef.metastart[type] + encodeURIComponent(item.id);
            itemResult.metadata = getMetadata(type, MetadataID, item.name.toLowerCase(), item.name);
            items.push(itemResult);
            itemsReturned += 1;
        });
    }
    const result = {
        items,
        returned: itemsReturned,
        total: data.total
    };

    return result;
}

function search(player, type, query, offset, limit, settings) {
    const spotifyApi = new SpotifyWebApi();
    const options = {
        limit,
        market: 'GB',
        offset
    };

    sid = player.system.getServiceId('Spotify');
    serviceType = player.system.getServiceType('Spotify');

    return Promise.resolve()
        .then(() => {
            switch (type) {
                case 'song':
                    return spotifyApi.searchTracks(`track:${query}`, options);
                case 'artist':
                    return spotifyApi.searchArtists(`artist:${query}`, options);
                case 'artisttoptracks':
                    return spotifyApi.searchArtists(`artist:${query}`, options);
                case 'album':
                    return spotifyApi.searchAlbums(`album:${query}`, options);
                default:
                    throw new Error('this search has not been implemented yet');
            }
        })
        .then((data) => {
            switch (type) {
                case 'song':
                    return getReturnResults(data.body.tracks, 'song');
                case 'artist':
                    return getReturnResults(data.body.artists, 'artist');
                case 'artisttoptracks':
                    return getReturnResults(data.body.artists, 'artisttoptracks');
                case 'album':
                    return getReturnResults(data.body.albums, 'album');
                default:
                    throw new Error('this search has not been implemented yet');
            }
        })
        .then((result) => {
            result.start = parseInt(offset);
            if (offset > 0) {
                result.previous = `${settings.webroot}/search?service=spotify&type=${type}&q=${query}&limit=${limit}&offset=${(offset - limit < 0 ? 0 : offset - limit)}`;
            }
            if (offset + result.returned < result.total) {
                result.next = `${settings.webroot}/search?service=spotify&type=${type}&q=${query}&limit=${limit}&offset=${(offset + limit)}`;
            }

            return result;
        })
        .catch((err) => {
            logger.error(util.inspect(err, null, false));
            throw err;
        });
}

module.exports = {
    search
};
