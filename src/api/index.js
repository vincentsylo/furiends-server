/* @flow */
import fs from 'fs';
import _ from 'lodash';

export default function (app) {
  _(fs.readdirSync(__dirname))
    .filter(file => file.indexOf('.') !== 0 && file !== 'index.js')
    .each(file => require(`./${file}`)(app)); // eslint-disable-line global-require,import/no-dynamic-require
}
