import express from 'express';
import bodyParser from 'body-parser';
import router from './routes/index';

// Initialize express app
const app = express();

// Use JSON body parser middleware
app.use(bodyParser.json());

// Use URL-encoded body parser middleware
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/', router);
app.listen(process.env.PORT || 5000, () => {
  console.log('Server is listening on port 5000 or PORT env!');
});

module.exports = app;
