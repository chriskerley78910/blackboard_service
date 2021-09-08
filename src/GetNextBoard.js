
let dba = require('./../../shared_services/src/PromisifiedMySQL');
const BoardRequest = require('./BoardRequest');
class GetNextBoard extends BoardRequest {

  constructor(){
    super();
    this.dba = dba
  }



  /**
   * Attempts to get the the next board given the current board Id.
   * If there is no next board then a new board is created and
   * returned in the response.
   */
  async handle(socket, args){
    try{
      const userId = socket.userId;
      if(!Number.isInteger(args.friendId) || !Number.isInteger(args.boardId)){
        throw new Error('friendId and boardId must be integers.')
      }
      const friendId = args.friendId;
      const boardId = args.boardId
      const SQL = `select *
                 from blackboards b inner join shared_blackboards s
                 where ((user_a = ? and user_b = ?) or (user_a = ? and user_b = ?))
                 and b.board_id = s.board_id
                 and b.board_id > ?
                 and trashed = 0
                 order by b.board_id
                 limit 1`;

      const results = await this.dba.query(SQL, [userId, friendId, friendId, userId, boardId]);
      if(results.length < 1){
          const roomId = this.getRoomId(userId, friendId);
          const freshBoard = await this.insertNewBoardAndReturnRefData(userId,friendId);
          const json = JSON.stringify(freshBoard)
          socket.emit('nextBoardReceived', json)
          socket.in(roomId).emit('friendAddedNewBoard',json);
      } else {
          this.setLastLoaded(results, userId);
          socket.emit('nextBoardReceived', JSON.stringify(results[0]))
      }
    } catch(err){
      socket.emit('io_error', err.message)
    }
  }



} // end class.


module.exports = GetNextBoard;
