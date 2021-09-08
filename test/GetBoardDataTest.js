const chai = require('chai');
const expect = chai.expect;
const sinon = require('sinon');
const fs = require('fs-extra');
chai.use(require('sinon-chai'))
const GetBoardData = require('./../src/GetBoardData');

    describe('GetBoardData Tests', function() {


    let sut = null;
    let sandbox = null;

    beforeEach(()=>{
      sut = new GetBoardData();
      sandbox = sinon.createSandbox();
    })

    afterEach(()=>{
      sandbox.restore();
    })

    it('getBoardData() does just that.', async () =>{

      const sock = {
        userId:1,
        emit:sandbox.spy()
      }
      const boardId = 2
      const ack = sandbox.spy()
      const board = {
        commands:[3]
      }
      sandbox.stub(sut,'getBlackboardUrl').resolves('some-url');
      sandbox.stub(sut,'updateLastLoaded').resolves(true);
      sandbox.stub(sut.fs,'readJson').resolves(board);
      await sut.handle(sock, boardId, ack)
      expect(JSON.parse(ack.getCall(0).args[0]).board_id).to.equal(boardId)
      expect(JSON.parse(ack.getCall(0).args[0]).commands).to.deep.equal(board.commands)
    })

    it('getBoardData() emits io_error is the boardId is missing.', async () =>{
      const sock = {
        userId:1,
        emit:sandbox.spy()
      }
      await sut.handle(sock, null)
      const call = sock.emit.getCall(0);
      expect(call.args[0]).to.equal('io_error')
      const expected = JSON.stringify({"error":"boardId must be an integer."})
      expect(call.args[1]).to.equal(expected)
    })


    it('updateLastLoaded(boardId) does just that.',()=>{

        let boardId = '2';
        let results = {
          affectedRows:1
        }
        sandbox.stub(sut.dba,'query').resolves(results);
        return sut.updateLastLoaded(boardId)
           .then(()=>{
             expect(true).to.be.true;
             expect(sut.dba.query.calledTwice).to.be.true;
           })
    })



})
