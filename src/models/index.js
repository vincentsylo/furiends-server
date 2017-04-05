/* @flow */
import fs from 'fs';
import path from 'path';
import Sequelize from 'sequelize';
import _ from 'lodash';

const sequelize = new Sequelize(
  process.env.POSTGRES_DB,
  process.env.POSTGRES_USER,
  process.env.POSTGRES_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: 'postgres',
    pool: {
      max: 5,
      min: 0,
      idle: 10000,
    },
  },
);

const db = {};
_(fs.readdirSync(__dirname))
  .filter(file => file.indexOf('.') !== 0 && file !== 'index.js')
  .each((file) => {
    const model = sequelize.import(path.join(__dirname, file));
    db[model.name] = model;
  });

_.keys(db, (modelName) => {
  if ('associate' in db[modelName]) {
    db[modelName].associate(db);
  }
});
db.sequelize = sequelize;
export default db;
