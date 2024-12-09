const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = 5069;
const SECRET_KEY = 'testKey'; //token-key

//middleware
app.use(cors());
app.use(express.json());

//connect to SQLite database
const dbPath = path.resolve(__dirname, './stock.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error connecting to database:', err.message);
  } else {
    console.log('Connected to SQLite database.');
  }
});

//authentication middleware
const authenticateUser = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]; //extract token from "Bearer <token>"

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized. No token provided.' });
  }

  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token.' });
    }

    req.user = decoded; //attach decoded user info to the request
    next();
  });
};

//user login endpoint
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }

  //check credentials in the database
  db.get(
    'SELECT * FROM users WHERE username = ? AND password = ?',
    [username, password],
    (err, user) => {
      if (err) {
        return res.status(500).json({ error: 'Database error.' });
      }
      if (!user) {
        return res.status(401).json({ error: 'Invalid username or password.' });
      }

      //generate JWT token
      const token = jwt.sign({ id: user.user_id, username: user.username }, SECRET_KEY, { expiresIn: '1h' });

      res.status(200).json({ token });
    }
  );
});

//get user balance
app.get('/get-balance', authenticateUser, (req, res) => {
  const userId = req.user.id;

  db.get('SELECT balance FROM users WHERE user_id = ?', [userId], (err, row) => {
    if (err) {
      return res.status(500).json({ error: 'Error retrieving balance.' });
    }
    if (!row) {
      return res.status(404).json({ error: 'User not found.' });
    }

    res.status(200).json({ balance: row.balance });
  });
});

//buy stock endpoint
app.post('/buy-stock', authenticateUser, (req, res) => {
  const user_id = req.user.id;
  const { stock_id, quantity } = req.body;

  if (!stock_id || !quantity || quantity <= 0) {
    return res.status(400).json({ error: 'Invalid input. Please provide valid stock_id and quantity.' });
  }

  db.get('SELECT * FROM stocks WHERE stock_id = ?', [stock_id], (err, stock) => {
    if (err) {
      return res.status(500).json({ error: 'Error querying stock.' });
    }
    if (!stock) {
      return res.status(404).json({ error: 'Stock not found.' });
    }

    const totalCost = stock.price * quantity;

    db.get('SELECT balance FROM users WHERE user_id = ?', [user_id], (err, user) => {
      if (err) {
        return res.status(500).json({ error: 'Error querying user balance.' });
      }
      if (!user || user.balance < totalCost) {
        return res.status(400).json({ error: 'Insufficient balance.' });
      }

      db.run('UPDATE users SET balance = balance - ? WHERE user_id = ?', [totalCost, user_id], (err) => {
        if (err) {
          return res.status(500).json({ error: 'Error updating balance.' });
        }

        const sql = `
          INSERT INTO purchases (user_id, stock_id, quantity)
          VALUES (?, ?, ?)
        `;
        db.run(sql, [user_id, stock_id, quantity], function (err) {
          if (err) {
            return res.status(500).json({ error: 'Error inserting purchase.' });
          }
          return res.status(201).json({
            message: 'Stock purchased successfully!',
            purchase_id: this.lastID,
          });
        });
      });
    });
  });
});

//query stocks owned by user
app.get('/user-stocks', authenticateUser, (req, res) => {
  const user_id = req.user.id;

  const sql = `
    SELECT s.stock_id, s.stock_symbol, s.company_name, p.quantity
    FROM purchases p
    JOIN stocks s ON p.stock_id = s.stock_id
    WHERE p.user_id = ?
  `;

  db.all(sql, [user_id], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Error querying user stocks.' });
    }
    if (rows.length === 0) {
      return res.status(404).json({ error: 'No stocks found for the user.' });
    }

    return res.status(200).json({
      user_id,
      stocks: rows,
    });
  });
});

//export db for external use
module.exports = db;

//start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
