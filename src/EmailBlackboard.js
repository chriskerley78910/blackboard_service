let BoardRequest = require('./BoardRequest');
const EmailTransport = require('./../../shared_services/src/EmailTransport')
const dba = require('./../../shared_services/src/PromisifiedMySQL')
const Jimp = require('jimp')

class EmailBlackboard extends BoardRequest{

  constructor(){
    super()
    this.handle = this.handle.bind(this)
    this.fillTransparentWithBlack = this.fillTransparentWithBlack.bind(this)
    this.dba = dba
    EmailTransport.make().then( t => {
      this.transporter = t
    })
  }

  /**
   *  {radius:0.001,point:{x:0.369,y:0.269}}
   * @param  {[type]} socket [description]
   * @return {[type]}        [description]
   */
  async handle(socket, args, ack){
    try {

        const userId = socket.userId
        if(!args.friendId || !args.img)
          throw new Error('friendId and img must be included')
        const friendId = args.friendId
        const image =  args.img.replace(/^data:image\/[a-z]+;base64,/, "");
        const jpegBase64Image = await this.fillTransparentWithBlack(image)
        const finalImage = jpegBase64Image.replace(/^data:image\/[a-z]+;base64,/, "");
        const SQL = `SELECT
                        first,
                        last,
                        email
                      FROM
                        users u
                      WHERE
                        u.id = ?`
        const firstResult = await this.dba.query(SQL,[friendId])
        const friendEmail = firstResult[0].email
        const secondResult = await this.dba.query(SQL,[userId])
        const userEmail = secondResult[0].email
        const userName = secondResult[0].first + ' ' + secondResult[0].last
        this.transporter.sendMail({
            from: userEmail,
            to: friendEmail,
            subject: `Shared blackboard from ${userName}`,
            text: 'Shared Blackboard from Palolo',
            html:'<html><body> Attached is the blackboard of the work. </body></html>',
            attachments:[{
              filename:'blackboard.jpeg',
              content:finalImage,
              encoding:'base64'
            }]
        }, (err, info) => {
            // console.log(info.envelope);
            // console.log(info.messageId);
        });
       ack('success')
    }
    catch(e){
        console.log(e.message)
    }
  }

  async fillTransparentWithBlack(base64encoded){
    const buf = new Buffer(base64encoded, 'base64')
    const p = new Promise((resolve, reject) =>{
      Jimp.read(buf, (err, image) => {
              if (err)
                  reject(err);
              else {
                  image.quality(90).getBase64(Jimp.MIME_JPEG, (err, src) => {
                          if (err)
                              reject(err);
                          else
                              resolve(src);
                      });
              }
          })
    })
    return p
  } // end functions.

}

module.exports = EmailBlackboard;
