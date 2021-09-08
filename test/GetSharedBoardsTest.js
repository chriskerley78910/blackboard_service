const chai = require('chai');
const expect = chai.expect;
const sinon = require('sinon');
const fs = require('fs-extra');
chai.use(require('sinon-chai'))
const GetSharedBoards = require('./../src/GetSharedBoards');
const dba = require('./../../shared_services/src/PromisifiedMySQL');;

    describe('GetSharedBoards tests', function() {

      let sut = null;
      let sandbox = null;

      beforeEach(() =>{
        sut = new GetSharedBoards();
        sandbox = sinon.createSandbox();
      })

      afterEach(()=>{
        sandbox.restore();
      })

      it('/sharedboards/4_5_234', () =>{
         let userId = 4;
         let friendId = 5;
         let boardId = 234;
         let fileName = sut.makeBoardURL(userId,friendId,boardId);
         expect(fileName).to.equal('test-4-5-234.bb');
         userId = 6;
         fileName = sut.makeBoardURL(userId, friendId, boardId);
         expect(fileName).to.equal('test-5-6-234.bb');
      })


      it('saveBlankBoardToFile(filename) does just that.', () =>{
        let fileName = 'save-blankboard-to-file-mock.bb';
        let expectedFilePath =  sut.getSharedBoardFullPath('save-blankboard-to-file-mock.bb');
        return sut.saveBlankBoardToFile(fileName)
         .then(actualFilePath =>{

             expect(actualFilePath).to.equal(expectedFilePath);
             fs.readFile(actualFilePath,'utf8')
               .then(file =>{
                 expect(file).to.equal('{"lines":[]}');
               })
         })

      })


      it('getLastBoardViewed(sock, args) does just that.' , async () => {
          const sock = {
            userId:1,
            emit:sandbox.spy()
          }
          const args = {
            friendId:2
          }

         const queryResult = [
          {
            board_id:1,
            board_url:'fake_url',
            user_a:1,
            last_loaded_a:'2019-02-19 12:12:12',
            user_b:2,
            last_loaded_b:'2019-02-19 12:12:12'
          }
        ]
        const expected = JSON.stringify(queryResult);
        sandbox.stub(sut.dba,'query').resolves(queryResult);
        await sut.getSharedBoards(sock, args)

        expect(sock.emit.called).to.be.true
        expect(sock.emit.getCall(0).args[0]).to.equal('sharedBoards')
        expect(typeof sock.emit.getCall(0).args[1]).to.equal('string')
      })


      it('updateBoardURL() throws if url is not a non-empty string', ()=>{
          return sut.updateBoardURL(1,'')
             .catch(error =>{
               expect(error.message).to.equal('board_url must be a non-empty string and boardId must be a postive integer.')
             })
      })


      it('setLastLoaded(boards, userId) adds the last_loaded property depending on which userId it is', ()=>{

          let boards = [
            {user_a:1, user_b:2, last_loaded_a:1, last_loaded_b:3},
            {user_a:2, user_b:1, last_loaded_b:2, last_loaded_b:4},
            {user_a:1, user_b:2, last_loaded_a:10, last_loaded_b:20}
          ];

          let userId = 1;
          sut.setLastLoaded(boards, userId);
          expect(boards[0].last_loaded).to.equal(1);
          expect(boards[1].last_loaded).to.equal(4);
          expect(boards[2].last_loaded).to.equal(10);
      })

      it('setLastLoaded(boards, userId) throws if no user matches userId', ()=>{

          let boards = [
            {user_a:1, user_b:2, last_loaded_a:1, last_loaded_b:3}
          ];

          let userId = 3;
          let f = ()=>{
                  sut.setLastLoaded(boards, userId);
          }
          expect(f).to.throw('Precondtion violated,  userId must exist in the list.');
      })

})
