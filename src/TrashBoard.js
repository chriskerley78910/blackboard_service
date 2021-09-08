let dba = require('./../../shared_services/src/PromisifiedMySQL');
const BoardRequest = require('./BoardRequest');

class TrashBoard extends BoardRequest {

  constructor(){
    super()
    this.dba = dba;
  }

  async trashBoard(sock, args){
    try{
      if(Number.isInteger(args.boardId) == false){
        throw new Error('boardId needed to trash it.')
      }
      const userId = sock.userId
      const boardId = args.boardId
      const SQL = `UPDATE
                    blackboards
                   SET
                    trashed = 1
                   WHERE
                    board_id = ?`;
      const result = await this.dba.query(SQL, [boardId]);
      if(result.affectedRows != 1){
        throw new Error("Something went wrong deleting the board.");
      }
      else{
        sock.emit('boardTrashed',JSON.stringify({friendId:userId, boardId:boardId}))
      }
    }
    catch(err){
      sock.emit('io_error',err.message);
    }
  }


  relayTrashToFriend(socket, update){
    try{
      if(isNaN(socket.userId) || isNaN(update.boardId) || isNaN(update.friendId) ){
        throw new Error('Invalid parameters.');
      }
      let userId = socket.userId;
      let boardId = update.boardId;
      let friendId = update.friendId;
      let roomId = this.getRoomId(userId, friendId);
      const json = JSON.stringify({friendId:userId, boardId:boardId})
      socket.in(roomId).emit('boardTrashed',json);
    }
    catch(err){
      console.log(err);
      socket.emit('error',{message:err.message});
    }
  }



}


module.exports = TrashBoard;
