import chai from 'chai';
import { createClient } from 'redis';
import redisClient from '../utils/redis';

const expect = chai.expect;

describe('redis client', function () {
  let client;
  before(async function() {
    client = await creatClient()
      .on('error', (error) => console.log('test redis server is connected', error))
      .connect();
  });

  after(async function() {
    client.disconnect();
  });

  it('should test if the redis client is working', async () => {
    expect(redisClient.isAlive()).to.be.true;
  });

  it('should test if the redis client set a key', async () => {
    expect(await redisClient.set('test', 'terawork', 5)).to.be.undefined;
    expect(client.get('test')).to.equal('terawork');
  });

  it('should not through an error', async () => {
    expect(async () => await redisClient.set('test', 'workTera', 40)).to.not.throw();
  });
});
