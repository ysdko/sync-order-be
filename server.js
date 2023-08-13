const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(cors());
app.use(bodyParser.json());

const orders = []; // この例ではメモリ内に注文データを保存しますが、実際のアプリではデータベースを使用するべきです。

io.on('connection', (socket) => {
  const roomName = socket.handshake.query.roomName;

  socket.join(roomName);

  socket.on('disconnect', () => {
    socket.leave(roomName);
  });
});

app.get('/orders/:roomName', (req, res) => {
  const roomOrders = orders.filter(order => order.roomName === req.params.roomName);
  res.json(roomOrders);
});

app.post('/orders', (req, res) => {
  const newOrder = {
    _id: Date.now().toString(), // この例ではタイムスタンプをIDとして使用していますが、実際のアプリでは適切なIDを生成するべきです。
    itemName: req.body.itemName,
    quantity: req.body.quantity,
    roomName: req.query.roomName
  };

  orders.push(newOrder);

  io.to(req.query.roomName).emit('order', newOrder);

  res.json(newOrder);
});

app.put('/orders/:orderId', (req, res) => {
  const orderIndex = orders.findIndex(order => order._id === req.params.orderId);

  if (orderIndex !== -1) {
    orders[orderIndex].quantity = req.body.quantity;

    io.to(orders[orderIndex].roomName).emit('order', orders[orderIndex]);

    res.json(orders[orderIndex]);
  } else {
    res.status(404).send('Order not found');
  }
});

app.get('/test', (req, res) => {
  res.json('test');
});

port = process.env.PORT || 3001;
server.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
