
let dba = require('./../../shared_services/src/PromisifiedMySQL');
const BoardRequest = require('./BoardRequest');
class GetPreviousBoard extends BoardRequest {

  constructor(){
    super();
  }



  /**
   * Attempts to get the the next board given the current board Id.
   * If there is no next board then a new board is created and
   * returned in the response.
   * @param  {[type]}   req  [description]
   * @param  {[type]}   res  [description]
   * @param  {Function} next [description]
   * @return {Promise}       [description]
   *
   * response is a board with id -1 if there is no previous board.
   */
  async getPreviousBoard(socket, args){

        try{
          const userId = socket.userId;
          if(!Number.isInteger(args.friendId) || !Number.isInteger(args.boardId)){
            throw new Error('friendId and boardId must be integers.')
          }
          const friendId = args.friendId;
          const boardId = args.boardId
          // console.log('Requesting boards that come before:' + boardId);
          const SQL = `select b.board_id, b.board_url, user_a, last_loaded_a, user_b, last_loaded_b
                    from blackboards b inner join shared_blackboards s
                    where ((user_a = ? and user_b = ?) or (user_a = ? and user_b = ?))
                    and b.board_id = s.board_id
                    and b.board_id < ?
                    and trashed = 0
                    order by b.board_id desc
                    limit 2`;

        const boards = await this.dba.query(SQL, [userId, friendId, friendId, userId, boardId]);
        this.setLastLoaded(boards, userId);
        if(boards.length < 1){
            socket.emit('previousBoardReceived',JSON.stringify([{board_id:-1}]));
        } else if(boards.length < 2){
            socket.emit('previousBoardReceived',JSON.stringify([{board_id:-1},boards[0]]));
        } else{
            socket.emit('previousBoardReceived',JSON.stringify([boards[1],boards[0]]));
        }
      }
      catch(e){
        socket.emit('io_error',e.message);
      }
  }



} // end class.


module.exports = GetPreviousBoard;
