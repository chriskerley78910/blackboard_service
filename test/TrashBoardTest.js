
const chai = require('chai');
const expect = chai.expect;
const sinon = require('sinon');
chai.use(require('sinon-chai'));
const TrashBoard = require('./../src/TrashBoard');

    describe('TrashBoard tests', () => {

    let sut = null;
    let sandbox = null;

    beforeEach(() =>{
      sandbox = sinon.createSandbox();
      sut = new TrashBoard();
    })

    afterEach(() =>{
      sandbox.restore();
    })

    it('trashBoard() res() == 400 if affectedRows != 1', async  ()=>{
      let result = {
        affectedRows:0
      }
      sandbox.stub(sut.dba,'query').returns(result);
      let sock = {
        userId:1,
        emit:sandbox.spy()
      }
      let args = {
        boardId:2
      }
      await sut.trashBoard(sock, args)
      expect(sock.emit.getCall(0).args[0]).to.equal('io_error')
    })

    it('trashBoard() ^ affectedRows == 1 => res("success")', async ()=>{
      let result = {
        affectedRows:1
      }
      sandbox.stub(sut.dba,'query').returns(result);
      let sock = {
        userId:1,
        emit:sandbox.spy()
      }
      let args = {
        boardId:2
      }
      await  sut.trashBoard(sock, args)
      expect(sock.emit.called).to.be.true
      expect(sock.emit.getCall(0).args[0]).to.equal('boardTrashed')
    })


    it('relayTrashToFriend(socket, fid, bId) => emit(boardTrashed) to room.', ()=>{
      let spy = sandbox.spy();
      let socket = {
        userId:5,
        in:sandbox.stub().returns({
          emit:spy
        }),
      }
      let fId = 2;
      let bId = 3;

      sut.relayTrashToFriend(socket, {friendId:fId, boardId:bId});
      expect(socket.in.called).to.be.true;
      expect(spy.called).to.be.true;
      let args = spy.getCall(0).args;
      expect(args[0]).to.equal('boardTrashed');
      const json = JSON.parse(args[1])
      expect(json.friendId).to.equal(socket.userId);
      expect(json.boardId).to.equal(bId);
    })



})
