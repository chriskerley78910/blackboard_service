let BoardRequest = require('./BoardRequest');
let fs = require('fs-extra');
let intersects = require('intersects');
class EraserUpdate extends BoardRequest{

  /**
   *  {radius:0.001,point:{x:0.369,y:0.269}}
   * @param  {[type]} socket [description]
   * @return {[type]}        [description]
   */
  eraserDownUpdate(socket, erase, ack){
    try {
        const userId = socket.userId
        if(!erase.friend_id || !Number.isInteger(erase.friend_id)){
          throw new Error('friend_id is missing or invalid.')
        }
        const rm = this.getRoomId(userId, erase.friend_id);
        erase.friend_id = userId
        socket.to(rm).emit('friendsEraserDownUpdate',erase);
        ack('success');
    }
    catch(e){
      socket.emit('io_error',e.message)
    }
  }

}

module.exports = EraserUpdate;
