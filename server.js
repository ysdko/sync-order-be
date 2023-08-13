const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(cors());
app.use(bodyParser.json());

require('dotenv').config();

// データベースの接続設定
const dbURL = process.env.DB_URL;
mongoose.connect(dbURL, { useNewUrlParser: true, useUnifiedTopology: true });

// スキーマの定義
const OrderSchema = new mongoose.Schema({
  itemName: String,
  quantity: Number,
  roomName: String
});

const Order = mongoose.model('Order', OrderSchema);

io.on('connection', (socket) => {
  const roomName = socket.handshake.query.roomName;

  socket.join(roomName);
  socket.on('disconnect', () => {
    socket.leave(roomName);
  });
});

app.get('/orders/:roomName', async (req, res) => {
  const roomOrders = await Order.find({ roomName: req.params.roomName });
  res.json(roomOrders);
});

app.post('/orders', async (req, res) => {
  const newOrder = new Order({
    itemName: req.body.itemName,
    quantity: req.body.quantity,
    roomName: req.query.roomName
  });

  await newOrder.save();

  io.to(req.query.roomName).emit('order', newOrder);

  res.json(newOrder);
});

app.put('/orders/:orderId', async (req, res) => {
  const updatedOrder = await Order.findByIdAndUpdate(req.params.orderId, { quantity: req.body.quantity }, { new: true });

  if (updatedOrder) {
    io.to(updatedOrder.roomName).emit('order', updatedOrder);
    res.json(updatedOrder);
  } else {
    res.status(404).send('Order not found');
  }
});

const port = process.env.PORT || 3001;
server.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
