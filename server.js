import express from 'express';
import router from './routes/index';
import bodyParser from 'body-parser';

// Initialize express app
const app = express();
app.use('/', router);

// Use JSON body parser middleware
app.use(bodyParser.json());

// Use URL-encoded body parser middleware
app.use(bodyParser.urlencoded({ extended: true }));

app.listen(process.env.PORT || 5000, () => {
  console.log('Server is listening on port 5000 or PORT env!');
});

module.exports = app;
