const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = 5069;

//middleware
app.use(cors());
app.use(express.json());

//connect to SQLite database
const dbPath = path.resolve(__dirname, './stocks.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error connecting to database:', err.message);
  } else {
    console.log('Connected to SQLite database.');
  }
});

//buy stock API
app.post('/buy-stock', (req, res) => {
  const { user_id, stock_id, quantity } = req.body;

  //input validation
  if (!user_id || !stock_id || !quantity || quantity <= 0) {
    return res.status(400).json({ error: 'Invalid input. Please provide valid user_id, stock_id, and quantity.' });
  }

  //check if the user exists
  db.get('SELECT * FROM users WHERE user_id = ?', [user_id], (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Error querying user.' });
    }
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    //check if the stock exists
    db.get('SELECT * FROM stocks WHERE stock_id = ?', [stock_id], (err, stock) => {
      if (err) {
        return res.status(500).json({ error: 'Error querying stock.' });
      }
      if (!stock) {
        return res.status(404).json({ error: 'Stock not found.' });
      }

      //insert the purchase into the purchases table
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

//query stocks owned by user API
app.get('/user-stocks/:user_id', (req, res) => {
    const { user_id } = req.params;
  
    //input validation
    if (!user_id) {
      return res.status(400).json({ error: 'Invalid input. Please provide a valid user_id.' });
    }
  
    //query to get all stocks owned by the user
    const sql = `
      SELECT s.stock_id, s.stock_name, s.stock_symbol, p.quantity
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

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
