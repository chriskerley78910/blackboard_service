const chai = require('chai');
const expect = chai.expect;
const sinon = require('sinon');
chai.use(require('sinon-chai'))
const Restorer = require('./../src/Restorer');

    describe('Restorer Tests', function() {

      let sandbox = null;
      let sut = null;

      beforeEach(()=>{
        sandbox = sinon.createSandbox();
        sut = new Restorer();
      })

      afterEach(()=>{
        sandbox.restore();
      })

      it('restoreTrashedBoard(invalid params) throws', async ()=>{
          let sock = {
              userId:null,
              emit:sandbox.spy()
          }
          let args = {
            boardId:null
          }
          await sut.restoreTrashedBoard(sock,args)
          expect(sock.emit.called).to.be.true
          expect(sock.emit.getCall(0).args[0]).to.equal('io_error')
        })

        it('restoreTrashedBoard(valid params) => responds with success.', async ()=>{

            let sock = {
                userId:1,
                emit:sandbox.spy()
            }
            let args = {
                boardId:2
            }
            let result = {
              affectedRows:1
            }
            sandbox.stub(sut,'updateLastLoaded').resolves(true);
            sandbox.stub(sut.dba,'query').returns(result);
            await sut.restoreTrashedBoard(sock, args)
            expect(sock.emit.called).to.be.true
            expect(sut.updateLastLoaded.called).to.be.true;
          })


        it('relayRestoreBoardToFriend(invalid parameters) => emits error.',async ()=>{

          let update = {
            boardId:1,
            friendId:2
          }
          let socket = {
            emit:sandbox.spy()
          }
          await sut.relayRestoreBoardToFriend(socket, update)
          expect(socket.emit.called).to.be.true;
          let args = socket.emit.getCall(0).args;
          expect(args[0]).to.equal('remote_error');
        })

        it('relayRestoreBoardToFriend(valid params) => emits to room boardRestored', async ()=>{

          let update = {
            boardId:1,
            friendId:2
          }
          let spy = sandbox.spy();
          let errorSpy = sandbox.spy();
          let socket = {
            in:()=>{
              return {
                emit:spy
              }
            },
            userId:3,
            emit:errorSpy
          }
          await sut.relayRestoreBoardToFriend(socket, update)
          expect(spy.called).to.be.true;
          let args = spy.getCall(0).args;
          expect(args[0]).to.equal('friendsBoardRestored');
        })


})
