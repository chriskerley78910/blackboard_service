const chai = require('chai');
const expect = chai.expect;
const sinon = require('sinon');
chai.use(require('sinon-chai'));
const Lock = require('./../src/Lock');



  describe('Lock Tests', function() {

    let sandbox = null;
    let lock = null;

      beforeEach(()=>{
        sandbox = sinon.createSandbox();
        lock = new Lock();
      })

      afterEach(()=>{
        sandbox.restore();
      })

      it('acquire() returns a promise that resolves iff release is called', ()=>{

        let promise = lock.acquire();

        return promise.then(()=>{
        
        })

      })





})
