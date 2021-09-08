
let BoardRequest = require('./BoardRequest');
let dba = require('./../../shared_services/src/PromisifiedMySQL');
let fs = require('fs-extra');

class GetBoardData extends BoardRequest {

  constructor(){
    super();
    this.dba = dba;
    this.fs = fs;
    this.handle = this.handle.bind(this);
    this.updateLastLoaded = this.updateLastLoaded.bind(this);
    this.getBlackboardUrl = this.getBlackboardUrl.bind(this)
  }

  async handle(socket, boardId, ack){

      try {
        const userId = socket.userId
        if(typeof Number(boardId) != 'number' || boardId < 1){
          throw new Error('boardId must be an integer.');
        }
        if(typeof ack != 'function'){
          throw new Error('ack must be a function');
        }
        const boardUrl = await this.getBlackboardUrl(boardId);
        await this.updateLastLoaded(boardId, userId);
        const board = await this.fs.readJson(__dirname + '/../sharedboards/' + boardUrl);
        const json = JSON.stringify({board_id:boardId, commands:board.commands});
        ack(json)
      } catch (err) {
        console.log(err)
        if(/Cannot read property/.test(err.message)){
          socket.emit('io_error', JSON.stringify({error:'Blackboard data is invalid or non existant.'}));
        }
        else if(/no such file or directory/.test(err.message)){
          socket.emit('io_error', JSON.stringify({error:'Board file not found.'}));
        }
        else{
          socket.emit('io_error', JSON.stringify({error:err.message}));
        }
      }
  }

  async getBlackboardUrl(boardId){
    const SQL = 'select board_url from blackboards where board_id = ?';
    const result = await this.dba.query(SQL,[boardId]);
    if(result.length != 1){
      throw new Error('No board exists for that id.');
    }
    else{
      return result[0].board_url;
    }
  }



} // end class.

module.exports = GetBoardData;
