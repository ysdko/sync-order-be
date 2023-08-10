const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

app.use(cors()); // CORS設定を追加

// ルームごとのクライアントのマッピング
const roomClients = {};

// クライアントが接続したときの処理
io.on('connection', (socket) => {
  console.log('クライアントが接続しました');

  // ルームに参加する処理
  socket.on('joinRoom', (roomName) => {
    socket.join(roomName);
    roomClients[roomName] = roomClients[roomName] || [];
    roomClients[roomName].push(socket.id);
    console.log('クライアントがルームに参加しました:', roomName);
  });

  // 注文情報の受信とブロードキャスト
  socket.on('sendOrder', (data) => {
    const roomName = data.roomName;
    io.to(roomName).emit('newOrder', data);
  });

  // クライアントが切断したときの処理
  socket.on('disconnect', () => {
    console.log('クライアントが切断しました');
    // ルームからクライアントを削除
    for (const roomName in roomClients) {
      const index = roomClients[roomName].indexOf(socket.id);
      if (index !== -1) {
        roomClients[roomName].splice(index, 1);
        break;
      }
    }
  });
});

// サーバーの起動
const port = 3001;
server.listen(port, () => {
  console.log(`サーバーがポート${port}で起動しました`);
});
