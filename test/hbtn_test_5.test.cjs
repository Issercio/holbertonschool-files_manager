import chai from 'chai';
import chaiHttp from 'chai-http';
import { describe, it } from 'mocha';

chai.use(chaiHttp);
const { expect } = chai;
const API_URL = 'http://0.0.0.0:5000';

let token = '';

describe('GET /files endpoints', () => {
  it('should authenticate and get a token', (done) => {
    chai.request(API_URL)
      .get('/connect')
      .set('Authorization', 'Basic Ym9iQGR5bGFuLmNvbTp0b3RvMTIzNCE=')
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.body).to.have.property('token');
        token = res.body.token;
        done();
      });
  });

  it('should list root files', (done) => {
    chai.request(API_URL)
      .get('/files')
      .set('X-Token', token)
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.body).to.be.an('array');
        // Optionally check structure of first file
        if (res.body.length > 0) {
          expect(res.body[0]).to.have.all.keys('id', 'userId', 'name', 'type', 'isPublic', 'parentId');
        }
        done();
      });
  });

  it('should list files for a specific parentId', (done) => {
    // Replace with a valid parentId from your DB if needed
    const parentId = '5f1e881cc7ba06511e683b23';
    chai.request(API_URL)
      .get(`/files?parentId=${parentId}`)
      .set('X-Token', token)
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.body).to.be.an('array');
        done();
      });
  });

  it('should get a file by id', (done) => {
    // Replace with a valid file id from your DB if needed
    const fileId = '5f1e8896c7ba06511e683b25';
    chai.request(API_URL)
      .get(`/files/${fileId}`)
      .set('X-Token', token)
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.body).to.have.all.keys('id', 'userId', 'name', 'type', 'isPublic', 'parentId');
        done();
      });
  });
});
