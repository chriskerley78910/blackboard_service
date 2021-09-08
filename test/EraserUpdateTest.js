const chai = require('chai');
const expect = chai.expect;
const sinon = require('sinon');
const fs = require('fs-extra');
chai.use(require('sinon-chai'))
const EraserUpdate = require('./../src/EraserUpdate');

    describe('EraserUpdate Tests', function() {


    let sut = null;
    let sandbox = null;

    beforeEach(()=>{
      sut = new EraserUpdate();
      sandbox = sinon.createSandbox();
    })

    afterEach(()=>{
      sandbox.restore();
    })

      let getMockBoard = ()=>{
        let board = {
          lines:[[{x:1.0,y:0.2},{x:0.3,y:0.2}]]
        };
        return board;
      }

      let getMockSocket = ()=>{
        let mockSocket = {
          userId:1,
          to:()=>{
            return {
              emit:()=>{}
            }
          }
        }
        return mockSocket;
      }

      let getMockUpdate = ()=>{
        let update = {
          friendId:1,
          boardURL:'test-board.bb',
          radius:1.0,
          point:{x:0.2,y:0.3}
        }
        return update;
      }


      it('eraserDownUpdate() => acknowledgement(success).', async() =>{

        const sock = getMockSocket()
        const erase = getMockUpdate()
        const ack = sandbox.spy();
        await sut.eraserDownUpdate(sock, erase, ack);
        expect(ack.called).to.be.true;
        expect(ack.getCall(0).args[0]).to.equal('success');
      })


      it('eraserDownUpdate() => ack(error).', async () =>{
        const sock = getMockSocket()
        const erase = getMockUpdate()
        erase.friendId = null
        const ack = sandbox.spy();
        await sut.eraserDownUpdate(sock, erase, ack);
        expect(ack.called).to.be.true;
        expect(ack.getCall(0).args[0]).to.equal("friend_id is missing or invalid.");
      })

})
