const api = require('../index-api');
api(__dirname, process.env.NODE_ENV == 'development');
