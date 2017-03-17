'use strict';

const _ = require('lodash');
const util = require('util');
const log4js = require('log4js');
const logger = log4js.getLogger('helpers/music_services/library.js');


function tidyArray(items) {
    const newItems = [];
    const myDefault = {
        album: '',
        artist: '',
        imageUrl: '',
        metadata: '',
        title: '',
        uri: ''
    };

    _.forEach(items, (item) => {
        const newItem = _.defaults(_(item)
            .omit(_.isNull)
            .value(), myDefault);

        newItem.albumTrackNumber = parseInt(item.albumTrackNumber);
        newItem.imageUrl = item.albumArtUri;
        newItems.push(newItem);
    });

    return newItems;
}


function search(player, type, query, offset, limit, settings) {
    return Promise.resolve()
        .then(() => {
            let sonosQuery;

            switch (type) {
                case 'song':
                    sonosQuery = `A:TRACKS:${query}`;
                    break;
                case 'artist':
                    sonosQuery = `A:ARTIST:${query}`;
                    break;
                case 'album':
                    sonosQuery = `A:ALBUM:${query}`;
                    break;
                default:
                    throw new Error('this search has not been implemented yet');
            }

            return player.browse(sonosQuery, offset, limit);
        })
        .then((data) => {
            const items = _.map(data.items, (value) => {
                return _.assign(value, {
                    type
                });
            });
            const result = {
                items: tidyArray(items),
                returned: parseInt(data.numberReturned),
                start: parseInt(offset) || 0,
                total: parseInt(data.totalMatches)
            };

            if (offset > 0) {
                result.previous = `${settings.webRoot}/search?service=library&type=${type}&q=${query}&limit=${limit}&offset=${(offset - limit < 0 ? 0 : offset - limit)}`;
            }
            if (offset + parseInt(data.numberReturned) < parseInt(data.totalMatches)) {
                result.next = `${settings.webRoot}/search?service=library&type=${type}&q=${query}&limit=${limit}&offset=${(offset + limit)}`;
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
