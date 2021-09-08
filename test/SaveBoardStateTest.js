const chai = require('chai');
const expect = chai.expect;
const sinon = require('sinon');
const fs = require('fs-extra');
chai.use(require('sinon-chai'))
const SaveBoardState = require('./../src/SaveBoardState');
const dba = require('./../../shared_services/src/PromisifiedMySQL');;

    describe('SaveBoardState tests', function() {

      let sut = null;
      let sandbox = null;

      beforeEach(() =>{
        sut = new SaveBoardState();
        sandbox = sinon.createSandbox();
      })

      afterEach(()=>{
        sandbox.restore();
      })

      it('save() throws if the board id is malformed.', () => {
        let socket = {};
        let data = JSON.stringify({
          boardId:-1,
          commands:[]
        });
        let ack = sandbox.spy();
        return sut.save(socket,{json:data},ack)
                  .then(()=>{
                    expect(ack.called).to.be.true;
                    let arg = ack.getCall(0).args[0];
                    expect(arg).to.equal("Error:board id must be a positive integer.");
                  })
      })

      it('save() throws if commands is malformed.', async () => {
        let socket = {};
        let data = JSON.stringify({
          board_id:1,
          commands:null
        });
        let ack = sandbox.spy();
        await sut.save(socket,{json:data},ack)
        expect(ack.called).to.be.true;
        let arg = ack.getCall(0).args[0];
        expect(arg).to.equal("Error:commands must be a non-empty array.");
      })


      it('save() throws if commands is malformed.', async () => {
        let socket = {};
        let data = JSON.stringify({
          board_id:1,
          commands:null
        });
        let ack = sandbox.spy();
        await sut.save(socket,{json:data},ack)
        expect(ack.called).to.be.true;
        let arg = ack.getCall(0).args[0];
        expect(arg).to.equal("Error:commands must be a non-empty array.");
      })




})
