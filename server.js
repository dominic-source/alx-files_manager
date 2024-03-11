import express from 'express';
import router from './routes/index';

// Initialize express app
const app = express();

// Use JSON body parser middleware
app.use(express.json());

// Use URL-encoded body parser middleware
// app.use(bodyParser.urlencoded({ extended: true }));

app.use('/', router);
const port = process.env.PORT || 5000;

app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});

export default app;
