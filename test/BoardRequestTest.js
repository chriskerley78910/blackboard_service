
const chai = require('chai');
const expect = chai.expect;
const sinon = require('sinon');
const fs = require('fs-extra');
chai.use(require('sinon-chai'))
const BoardRequest= require('./../src/BoardRequest');


    describe('BoardRequest tests', function() {

      let sut = null;
      let sandbox = null

      beforeEach(() =>{
        sut = new BoardRequest();
        sandbox = sinon.createSandbox();
      })

      afterEach(()=>{
        sandbox.restore();
      })

      it('makeBoardURL()',()=>{
        let url = sut.makeBoardURL(1,2,3);
        expect(url).to.equal('test-1-2-3.bb');
      })

      it('insertNewBoardAndReturnRefData() returns a complete board', done =>{
          sandbox.stub(sut.dba,'query').returns({insertId:5});
          sandbox.stub(sut,'saveBlankBoardToFile');
          sandbox.stub(sut,'updateBoardURL');
          sut.insertNewBoardAndReturnRefData('1','2')
             .then(board =>{
               expect(board.board_url).to.equal('test-1-2-5.bb');
               expect(board.board_id).to.equal(5);
               expect(typeof board.last_loaded).to.equal('string');//DefineD();

               sut.dba.query.restore();
               done();
             })
      })

      it('insertSharedBoardRecord(userA, userB) throws if params are malformed', ()=>{
        sandbox.stub(sut.dba,'query').resolves(true);
        return sut.insertSharedBoardRecord(null,null)
                  .catch(err =>{

                    expect(err.message).to.equal('UserIds must be postive integers.');
                  })

      })


})
