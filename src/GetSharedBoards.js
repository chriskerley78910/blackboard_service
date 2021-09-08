
let dba = require('./../../shared_services/src/PromisifiedMySQL');
let Lock = require('./Lock');
const lock = new Lock();
const BoardRequest = require('./BoardRequest');


class GetSharedBoards extends BoardRequest {

  constructor(){
    super();
    this.dba = dba;
  }


  /**
   * Attempts to get the last board viewed by the user
   * if there is no last board viewed then a new board url is created.
   * and the boardId is return to the user.
   * @param  {[type]}   req  [description]
   * @param  {[type]}   res  [description]
   * @param  {Function} next [description]
   * @return {Promise}       [description]
   */
  async getSharedBoards(socket, args){

      await lock.acquire(); // Stops race conditions.
      const userId = socket.userId
      const friendId = args.friendId;
      const sql = `select b.board_id,
                          b.board_url,
                          s.user_a,
                          s.last_loaded_a,
                          s.user_b,
                          s.last_loaded_b
                 from blackboards b
                 inner join shared_blackboards s
                 where b.board_id = s.board_id
                 and (
                       user_a = ? and user_b = ?
                       or
                       user_a = ? and user_b = ?
                     )
                 and trashed = 0`;

      const boards = await dba.query(sql, [userId, friendId, friendId, userId]);
      if(boards.length < 1){ // there are no shared boards.
          let newBoard = await this.insertNewBoardAndReturnRefData(userId,friendId);
          if(!newBoard.board_url || !newBoard.board_id || !newBoard.last_loaded){
            throw new Error("Board is malformed!");
          }
          newBoard = [newBoard];
          const response = JSON.stringify(newBoard)
          socket.emit('sharedBoards',response)
          lock.release();
      } else {
          this.setLastLoaded(boards, userId);
          const response = JSON.stringify(boards)
          socket.emit('sharedBoards',response)
          lock.release();
      }
    }







} // end class.


module.exports = GetSharedBoards;
