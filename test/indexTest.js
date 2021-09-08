const chai = require('chai');
const expect = chai.expect;
const sinon = require('sinon');
const fs = require('fs-extra');
chai.use(require('sinon-chai'));
let dba = require('./../../shared_services/src/PromisifiedMySQL');;
const index = require('./../src/index');



  describe('index tests', function() {

    let sandbox = null;

      beforeEach(()=>{
        sandbox = sinon.createSandbox();
      })

      afterEach(()=>{
        sandbox.restore();
      })






})
