const SERVER_NAME = 'blackboard_server';
const express = require('express');
const cors = require('cors');
const app = express();
const fs = require('fs-extra');
const lockfile = require('proper-lockfile');

let dba = require('./../../shared_services/src/PromisifiedMySQL');
const auth = new (require('../../shared_services/src/Auth'))();
const portFinder = new (require('../../shared_services/src/PortFinder'))();
const getSharedBoardsHandler = new (require('./GetSharedBoards'))();
const getNextBoardHandler = new (require('./GetNextBoard'))();
const getPreviousBoardHandler = new (require('./GetPreviousBoard'))();
const eraserHandler = new (require('./EraserUpdate'))();

const GetBoardData = require('./GetBoardData');
const getBoardDataHandler = new GetBoardData();



const TrashBoard = require('./TrashBoard');
const trashBoardBoardHandler = new TrashBoard();

const Restorer = require('./Restorer');
const restoreHandler = new Restorer();

const SaveBoardState = require('./SaveBoardState');
const saveHandler = new SaveBoardState();

const EmailBlackboard = require('./EmailBlackboard')
const blackboardEmailer = new EmailBlackboard()



let injectDBA = (injectedDBA)=>{
  dba = injectedDBA;
}







let checkAuth = async (req,res,next) =>{

    try{
        auth.headerExists(req);
        let token = req.headers.authorization;
        req.userId =  auth.getUserIdFrom(token);
        next(); // go to next step in middleware.
    }
    catch(err){
      res.status(401);
      res.end("token invalid:" + err.message);
    }
  }


// gives access to the shared boards file.
app.use(express.static(__dirname + '/../sharedboards'));

const options = {
    credentials:true,  // set the Access-Control-Allow-credentials header.
    origin:true // accept any origin.
  }
cors(options);
app.use(cors());

const server = auth.getHttpServerForApp(process.argv[2], app);
const io = auth.getSocketIOUsing(server);
const origins = '(http:\/\/127.0.0.1[/]{0,1})|(https:\/\/palolo.ca)|(https:\/\/www.palolo.ca[/]{0,1}|(http:\/\/localhost\/)|(http:\/\/localhost))';
const originTester = auth.buildOriginTester(origins, SERVER_NAME);
io.origins(originTester);

io.use((socket,next) => {
  auth.authenticateSocket(socket,next);
})



let getRoomId = (userId,friendId) =>{
  if(userId < friendId){
    return userId + '-' + friendId;
  }
  else{
    return friendId + '-' + userId;
  }
}



let joinRoom = (socket) =>{
  return (data,acknowledgment) => {
    socket.leaveAll();
    let rmId = getRoomId(socket.userId,data.friendId);
    socket.join(rmId);
    acknowledgment('success');
  }
}


//  POSITION UPDATERS.

/**
 * Sends the updated position from the one user to another.
 * @param  {[type]} update         [description]
 * @param  {[type]} acknowledgment [description]
 */
let cursorPositionUpdate = (socket)=>{
  return (update, acknowledgment) => {
    let roomId = getRoomId(socket.userId, update.friendId);
    socket.to(roomId).emit('friendsCursorPosition',{
      friendId:socket.userId,
      boardId:update.boardId,
      position:update.position
    });
    acknowledgment('success');
  }
}


const pencilPositionUpdate = (socket) => {
  return (pencil) =>{
    const userId = socket.userId
    const friendId = pencil.friendId
    const rm = getRoomId(userId, friendId);
    pencil.friendId = socket.userId
    socket.to(rm).emit('friendPencilPositionUpdate',pencil)
  }
}


let eraserPositionUpdate = (socket) =>{
  return (update,acknowledgment) =>{
    let roomId = getRoomId(socket.userId, update.friendId);
    socket.to(roomId).emit('onFriendsEraserPositionUpdate', {
      friendId:socket.userId,
      boardId:update.boardId,
      position:{x:update.x,y:update.y}
    });
  }
}

const pencilLineUpdate = (socket) => {
  return (line, acknowledgment) => {
    const rm = getRoomId(socket.userId, line.friend_id);
    line.friend_id = socket.userId
    socket.to(rm).emit('friendsPencilLineUpdate', line);
    acknowledgment();
  }
}



io.on('connect',(socket) => {
    // console.log('blackboard: socket for user ' + socket.userId + ' connected');

    socket.on('getSharedBoards',(args)=>{
      getSharedBoardsHandler.getSharedBoards(socket, args)
    })

    socket.on('getBoard',(args, ack)=>{
      getBoardDataHandler.handle(socket,args, ack)
    })

    socket.on('getAdditionalBoardData', (args, ack) => {
      getBoardDataHandler.handle(socket,args, ack)
    })

    socket.on('nextBoard',(args)=>{
      getNextBoardHandler.handle(socket, args)
    })


    socket.on('previousBoard',(args)=>{
      getPreviousBoardHandler.getPreviousBoard(socket, args)
    })


    // relays.
    socket.on('myCursorPosition',cursorPositionUpdate(socket));
    socket.on('myPencilPosition',pencilPositionUpdate(socket));
    socket.on('myEraserPosition',eraserPositionUpdate(socket));
    socket.on('trashBoard', (args) => {
      trashBoardBoardHandler.trashBoard(socket,args)
    })
    socket.on('relayTrashBoard',(update)=>{
      trashBoardBoardHandler.relayTrashToFriend(socket, update);
    })
    socket.on('relayRestoreBoard', (update) => {
      restoreHandler.relayRestoreBoardToFriend(socket, update);
    })

    socket.on('restoreBoard',(args) => {
      restoreHandler.restoreTrashedBoard(socket, args);
    })

    socket.on('emailBlackboard',(args, ack)=>{
      blackboardEmailer.handle(socket,args, ack)
    })
    // mutators. (change the clients board state)
    socket.on('myPencilLine',pencilLineUpdate(socket));
    socket.on('myEraserDown',(erase, ack)=>{
      eraserHandler.eraserDownUpdate(socket, erase, ack)
    });

    // changes the persistant board state. (needs file locking!).
    // to prevent reads from occuring while json data is being written!
    socket.on('saveBoardState',(json, ack) => {
        saveHandler.save(socket, json, ack);
    });

    socket.on('joinRoom',joinRoom(socket));
})



let startApp = async (expressApp) =>{
    let port = await portFinder.find(SERVER_NAME);
    server.listen(port, () => console.log(SERVER_NAME + ` listening on port ${port}`));
}
let command = process.argv[2];
// console.log("Staring command == " + command);
if(/test/.test(command) == false || command == 'testing'){
  startApp(app);
}




module.exports = {
  fs:fs,
  injectDBA:injectDBA
}
