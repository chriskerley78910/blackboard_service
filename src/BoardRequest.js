let dba = require('./../../shared_services/src/PromisifiedMySQL');
const fs = require('fs-extra');

class BoardRequest {

  constructor(){
    this.dba = dba;
    this.insertNewBoardAndReturnRefData = this.insertNewBoardAndReturnRefData.bind(this);

  }




  /**
   * Inserts a new board into the system fro the userId frienId pair.
   * @param  {Number}  userId
   * @param  {Number}  friendId
   * @return {Promise}  That resolves to a object
   *                    containing the url and unique
   *                    id of the board.
   */
   async insertNewBoardAndReturnRefData(userId, friendId){

    let sql = 'insert into blackboards (board_id) values (null);';
    let result = await dba.query(sql);
    let boardId = result.insertId;
    await this.insertSharedBoardRecord(boardId, userId, friendId);
    const url = this.makeBoardURL(userId,friendId,boardId);
    const timestamp = (new Date()).toISOString(); // keeps the client happy. (last_loaded is required.)
    await this.saveBlankBoardToFile(url);
    await this.updateBoardURL(boardId, url);

    return {
      board_id:boardId,
      board_url:url,
      last_loaded:timestamp
    };
}


async insertSharedBoardRecord(boardId, userA, userB){
  try{
    if(!boardId || isNaN(boardId) || !userA || isNaN(userA) || !userB ||  isNaN(userB)){
      throw new Error('UserIds must be postive integers.');
    }
    let sql = 'insert into shared_blackboards (board_id, user_a, user_b) values (?,?,?)';
    await dba.query(sql,[boardId, userA, userB]);
  }
  catch(err){
    // console.log(err);
    throw new Error(err.message);
  }
}


/**
 * Makes the file url for a blackboard.
 * @param  {HTTPRequest} req
 * @param  {Number} boardId
 * @return {string}
 */
makeBoardURL(userId, friendId, boardId){


  let url = "";
  if(dba.isDevEnv()){
    url = url + 'test-';
  }
  let seperator = '-';
  if(userId < friendId){
    url = url + userId + seperator + friendId;
  }
  else{
    url = url + friendId + seperator + userId;
  }
  return url + seperator + boardId + ".bb";
}


async saveBlankBoardToFile(url){
    const b = {
      commands:[]
    }
    const json = JSON.stringify(b);
    const path = this.getSharedBoardFullPath(url);
    try {
      await fs.outputFile(path, json);
      return path;
    } catch (err) {
      console.error(err)
    }
  }



  getRoomId(userId,friendId){
    if(userId < friendId){
      return userId + '-' + friendId;
    }
    else{
      return friendId + '-' + userId;
    }
  }

  /**
   *
   * @param  {string} boardURL
   */
  getSharedBoardFullPath(boardURL){
      return __dirname + '/../sharedboards/' + boardURL;
  }


 async updateBoardURL(boardId, boardURL){
    if(!boardURL || typeof boardURL !== 'string' || boardURL.length <= 0 || isNaN(boardId)){
      throw new Error('board_url must be a non-empty string and boardId must be a postive integer.');
    }
    let updateBoardURLSQL = 'update blackboards set board_url = ? where board_id = ?';
    await dba.query(updateBoardURLSQL,[boardURL,boardId]);
    return true;
  }



  setLastLoaded(boards, userId){
    boards.forEach(b =>{
      if(b.user_a == userId){
        b.last_loaded = b.last_loaded_a;
      }
      else if(b.user_b == userId){
        b.last_loaded = b.last_loaded_b;
      }
      else{
        throw new Error('Precondtion violated,  userId must exist in the list.');
      }
    });
  }


  async updateLastLoaded(boardId, userId){

      let sql1 = 'update shared_blackboards set last_loaded_a = now() where board_id = ? and user_a = ?';
      let result1 = await this.dba.query(sql1,[boardId, userId]);

      let sql2 = 'update shared_blackboards set last_loaded_b = now() where board_id = ? and user_b = ?';
      let result2 = await this.dba.query(sql2,[boardId, userId]);

      if(result1.affectedRows != 1 && result2.affectedRows != 1){
        throw new Error("Something went wrong updating a board timestamp.");
      }
      else{
        return true;
      }
  }



}




module.exports = BoardRequest;
