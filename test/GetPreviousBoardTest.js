const chai = require('chai');
const expect = chai.expect;
const sinon = require('sinon');
const fs = require('fs-extra');
chai.use(require('sinon-chai'))
const GetPreviousBoard = require('./../src/GetPreviousBoard');
const dba = require('./../../shared_services/src/PromisifiedMySQL');;

    describe('GetPreviousBoard tests', function() {

      let sut = null;
      let sandbox = null;

      beforeEach(() =>{
        sut = new GetPreviousBoard();
        sandbox = sinon.createSandbox();
      })

      afterEach(()=>{
        sandbox.restore();
      })

      it('getPreviousBoard(wrong params) throws', async () =>{
        const sock = {
          userId:1,
          emit:sandbox.spy()
        }
        const args = {
          friendId:1,
          boardId:null
        }
        sandbox.stub(sut,'setLastLoaded')
        const expected = {}
        sandbox.stub(sut.dba,'query').resolves([expected])
        await sut.getPreviousBoard(sock, args)

        const call = sock.emit.getCall(0)
        expect(call.args[0]).to.equal('io_error')
      })

})
