import express from 'express';
import router from './routes/index';

// Initialize express app
const app = express();
app.use('/', router);

app.listen(process.env.PORT || 5000, () => {
  console.log('Server is listening on port 5000 or PORT env!');
});

module.exports = app;
