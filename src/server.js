/* @flow */
import express from 'express';
import axios from 'axios';
import redis from 'redis';
import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';
import 'dotenv/config'; // Setup process.env variables
import models from './models';

// Start redis client
const client = redis.createClient();
client.on('error', (err) => {
  console.error(`Redis failed to listen: ${err}`);
});

// Setup express server
const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

app.get('/api/:username', (req, res) => {
  const { username } = req.params;
  client.get(username, (err, result) => {
    if (result) {
      res.send({ totalStars: result, source: 'redis cache' });
    } else {
      getUserRepositories(username)
        .then(computeTotalStars)
        .then((totalStars) => {
          client.setex(username, 60, totalStars);
          res.send({ totalStars, source: 'GitHub API' });
        })
        .catch((response) => {
          if (response.status === 404) {
            res.send('The GitHub username could not be found.');
          } else {
            res.send(response);
          }
        })
    }
  })
});

const port = process.env.PORT || 3000;
models.sequelize.sync({ force: false })
  .then(() => {
    app.listen(port, () => {
      console.log(`Server listening on port: ${port}`); // eslint-disable-line
    });
  });

function getUserRepositories(user) {
  const githubEndpoint = `https://api.github.com/users/${user}/repos?per_page=100`;
  return axios.get(githubEndpoint);
}

function computeTotalStars(repositories) {
  return repositories.data.reduce((prev, curr) => {
    return prev + curr.stargazers_count;
  }, 0);
}
