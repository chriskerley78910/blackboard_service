const chai = require('chai');
const expect = chai.expect;
const sinon = require('sinon');
const fs = require('fs-extra');
chai.use(require('sinon-chai'))
const GetNextBoard = require('./../src/GetNextBoard');
const dba = require('./../../shared_services/src/PromisifiedMySQL');;

    describe('GetNextBoard tests', function() {

      let sut = null;
      let sandbox = null;

      beforeEach(() =>{
        sut = new GetNextBoard();
        sandbox = sinon.createSandbox();
      })

      afterEach(()=>{
        sandbox.restore();
      })

      it('handle(), board exists => emits to creator only.', async () =>{
        const sock = {
          userId:1,
          emit:sandbox.spy()
        }
        const args = {
          friendId:1,
          boardId:1
        }
        sandbox.stub(sut,'setLastLoaded')
        const expected = {}
        sandbox.stub(sut.dba,'query').resolves([expected])
        await sut.handle(sock, args)

        const call = sock.emit.getCall(0)
        expect(call.args[0]).to.equal('nextBoardReceived')
        expect(call.args[1]).to.equal(JSON.stringify(expected))


      })

      it('handle(), board does not exist => emits to everyone in room.', async () =>{
        const spy = sandbox.spy()
        const sock = {
          userId:1,
          emit:sandbox.spy(),
          in:()=>{
            return {
              emit:spy
            }
          }
        }
        const args = {
          friendId:1,
          boardId:1
        }
        sandbox.stub(sut,'setLastLoaded')
        sandbox.stub(sut.dba,'query').resolves([])
        const freshBoard= {}
        sandbox.stub(sut,'insertNewBoardAndReturnRefData').resolves(freshBoard)
        await sut.handle(sock, args)

        const expected = JSON.stringify(freshBoard)
        const call = sock.emit.getCall(0)
        expect(call.args[0]).to.equal('nextBoardReceived')
        expect(call.args[1]).to.equal(expected)

        const call2 = spy.getCall(0)
        expect(call2.args[0]).to.equal('friendAddedNewBoard')
        expect(call2.args[1]).to.equal(expected)


      })

})
