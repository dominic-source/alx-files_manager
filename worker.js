import Queue from 'bull';
import { ObjectId } from 'mongodb';
import imageThumbnail from 'image-thumbnail';
import fs from 'fs';
import dbClient from './utils/db';

const fileQueue = new Queue('image_upload', {
  redis: {
    host: 'localhost',
    port: 6379,
  },
});

fileQueue.process(async (job, done) => {
  if (!('fileId' in job.data)) {
    done(new Error('Missing fileId'));
  }

  if (!('userId' in job.data)) {
    done(new Error('Missing userId'));
  }

  const {
    fileId, userId,
  } = job.data;

  const collection = dbClient.db.collection('files');
  collection.findOne(
    { _id: new ObjectId(fileId), userId: new ObjectId(userId) },
    (err, result) => {
      if (err) done(new Error('File not found'));
      if (!result) done(new Error('File not found'));

      // define size for different widths of image
      const options = [
        { width: 500 },
        { width: 250 },
        { width: 100 },
      ];
      // Iterate through options to generate different width of thumnail
      for (const option of options) {
        imageThumbnail(result.localPath, option)
          .then((thumbnail) => {
            fs.writeFile(
              `${result.localPath}_${option.width}`,
              thumbnail,
              (err) => console.log('An error occured: ', err),
            );
          })
          .catch((err) => console.log(err));
      }
    },
  );
});
