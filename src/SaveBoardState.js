let dba = require('./../../shared_services/src/PromisifiedMySQL');
const lockfile = require('proper-lockfile');
const fs = require('fs-extra');

class SaveBoardState {

  constructor(){
    this.dba = dba;
  }

  async save(socket, data, ack){
    try{

      let jsBoard = JSON.parse(data.json);
      if(isNaN(jsBoard.board_id) || jsBoard.board_id <= 0){
        throw new Error("board id must be a positive integer.");
      }
      if(Array.isArray(jsBoard.commands) == false || jsBoard.commands.length <= 0){
        throw new Error('commands must be a non-empty array.');
      }
      let boardId = jsBoard.board_id;
      let commands = jsBoard.commands;
      let sql = 'select board_url from blackboards where board_id = ?';
      let boardUrls = await dba.query(sql,[boardId]);
      if(boardUrls.length != 1){
        throw new Error('No board found with the given id.');
      }

      // write to the file.
      let path  = __dirname + '/../sharedboards/' + boardUrls[0].board_url;
      let releaseFunction = await lockfile.lock(path);
      let persistObject = {commands:commands};
      let persistJson = JSON.stringify(persistObject);
      let result = await fs.outputFile(path, persistJson);
      releaseFunction();
    }
    catch(err){
      console.log(err.message);
      ack('Error:' + err.message);
    }

  }




}

module.exports = SaveBoardState;
