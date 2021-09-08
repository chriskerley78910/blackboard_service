const chai = require('chai');
const expect = chai.expect;
const sinon = require('sinon');
const fs = require('fs-extra');
chai.use(require('sinon-chai'))
const EmailBlackboard = require('./../src/EmailBlackboard');

    describe('EmailBlackboard Tests', function() {


    let sut = null;
    let sandbox = null;

    beforeEach(()=>{
      sut = new EmailBlackboard();
      sandbox = sinon.createSandbox();
    })

    afterEach(()=>{
      sandbox.restore();
    })

    it('throws if the img arg is null', async ()=>{
      try{
        const args = {friendId:1, img:null}
        await sut.handle(args)
      } catch(err){
        expect(err.message).to.equal('img must be string')
      }
    })

    it('calls transporter with emails', async ()=>{
      const sock = {userId:1}
      const args = {friendId:1, img:'bas64'}
      const ack = sandbox.spy()
      const img = 'imagedata'
      sandbox.stub(sut,'fillTransparentWithBlack').resolves(img)
      const results = [
                        {
                        email:'chris@palolo.ca',
                        first:'chris',
                        last:'kerley'
                        }
                      ]
      sandbox.stub(sut.dba,'query').resolves(results)
      sut.transporter = {
        sendMail:sandbox.spy()
      }

      await sut.handle(sock, args, ack)
      expect(sut.transporter.sendMail.called).to.be.true
      expect(ack.called).to.be.true
    })

})
