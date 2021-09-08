
let dba = require('./../../shared_services/src/PromisifiedMySQL');
let BoardRequest = require('./BoardRequest');

class Restorer extends BoardRequest {

  constructor(){
    super();
    this.dba = dba;
  }

  async restoreTrashedBoard(socket, args){
    try{
      if(Number.isInteger(args.boardId) == false){
        throw new Error('boardId must be an integer.');
      }
      const boardId = args.boardId
      const userId = socket.userId
      const SQL = `UPDATE
                      blackboards
                   SET
                      trashed = 0
                   WHERE
                      board_id = ?
                   AND
                      trashed = 1`;
      const result = await this.dba.query(SQL,[boardId]);
      if(result.affectedRows != 1){
        throw new Error('Something went wrong restoring the board.');
      }
      else{
        // to ensure that the deleted board becomes the current board.
        await this.updateLastLoaded(boardId, userId);
        socket.emit('boardRestored')
      }
    }
    catch(err){
      socket.emit('io_error',err.message)
    }
  }

  async relayRestoreBoardToFriend(socket, update){
    try{
      if(!update || !update.friendId || isNaN(update.friendId) || isNaN(update.boardId)){
        throw new Error('relayRestoreBoard invalid params.');
      }
      let userId = socket.userId;
      let boardId = update.boardId;
      let friendId = update.friendId;
      let roomId = this.getRoomId(friendId, userId);
      socket.in(roomId).emit('friendsBoardRestored',{friendId:userId, boardId:boardId});
    }
    catch(err){
      // console.log(err);
     socket.emit('remote_error',err.message);
    }
  }


} // end class.
module.exports = Restorer;
