import { MongoClient } from 'mongodb';

const dbHost = process.env.DB_HOST || 'localhost';
const dbPort = process.env.DB_PORT || '27017';
const dbDatabase = process.env.DB_DATABASE || 'files_manager';

class DBClient {
  constructor() {
    // this.url = 'mongodb+srv://filemanagercluster.3uyhuyj.mongodb.net/?authSource=%24external&authMechanism=MONGODB-X509&retryWrites=true&w=majority&appName=fileManagerCluster';
    this.url = `mongodb://${dbHost}:${dbPort}`;
    this.client = new MongoClient(this.url);
    this.client.connect().then(() => {
      // console.log('Connection established');
      this.db = this.client.db(dbDatabase);
    })
      .catch((err) => {
        console.log('Connection was not established', err);
      });
  }

  isAlive() {
    // Send a ping to confirm a successful connection
    return this.client.isConnected();
  }

  async nbUsers() {
    try {
      const users = await this.db.collection('users').countDocuments();
      return users;
    } catch (err) {
      // console.log('An Error was encountered!');
      return null;
    }
  }

  async nbFiles() {
    try {
      const files = await this.db.collection('files').countDocuments();
      return files;
    } catch (err) {
      // console.log('An Error was encountered in getting the number of files!');
      return null;
    }
  }
}

const dbClient = new DBClient();
module.exports = dbClient;
