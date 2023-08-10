const express = require('express');
const cors = require('cors');

const mongoose = require('mongoose');
const WebSocket = require('ws');

const app = express();
const wss = new WebSocket.Server({ noServer: true });

app.use(express.json());
app.use(cors());

const orderSchema = new mongoose.Schema({
  itemName: String,
  quantity: Number,
});

const Order = mongoose.model('Order', orderSchema);

// 新しい注文を作成するエンドポイント
app.post('/orders', async (req, res) => {
  const newOrder = new Order(req.body);
  const savedOrder = await newOrder.save();

  // WebSocketを通じて全クライアントに新しい注文を通知
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(savedOrder));
    }
  });

  res.json(savedOrder);
});

// 既存の注文を更新するエンドポイント
app.put('/orders/:id', async (req, res) => {
  const updatedOrder = await Order.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true }
  );

  // WebSocketを通じて全クライアントに注文の更新を通知
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(updatedOrder));
    }
  });

  res.json(updatedOrder);
});

// 注文のカウントを取得するエンドポイント
app.get('/orders/count', async (req, res) => {
  const count = await Order.countDocuments();
  res.json({ count });
});

mongoose.connect('mongodb://localhost:27017/orders', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    const server = app.listen(3001, () => console.log('Server is running on port 3001'));
    server.on('upgrade', (request, socket, head) => {
      wss.handleUpgrade(request, socket, head, ws => {
        wss.emit('connection', ws, request);
      });
    });
  })
  .catch(err => console.error(err));

