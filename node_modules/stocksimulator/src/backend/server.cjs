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
const dbPath = path.resolve(__dirname, './stock.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error connecting to database:', err.message);
  } else {
    console.log('Connected to SQLite database.');
  }
});

// API endpoint for user login
app.post('/login', (req, res) => {
  const { email, password } = req.body;

  db.get(
    'SELECT * FROM users WHERE email = ? AND password = ?',
    [email, password],
    (err, user) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (!user) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }
      res.json({ message: 'Login successful', user });
    }
  );
});

//add user API
app.post('/add-user', (req, res) => {
  const { username, email, password } = req.body;

  //validate input
  if (!username || !email || !password) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  try {
    //not hashing passwords for development purposes
    //insert the user into the database
    const sql = `
      INSERT INTO users (username, email, password, balance)
      VALUES (?, ?, ?, ?)
    `;
    const initialBalance = 10000; //initial starting balance
    
    db.run(sql, [username, email, password, initialBalance], function (err) {
      if (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
          return res.status(400).json({ error: 'Email already exists.' });
        }
        return res.status(500).json({ error: 'Error adding user to the database.' });
      }

      res.status(201).json({
        message: 'User successfully registered.',
        id: this.lastID, //return the newly created user's ID
      });
    });
  } catch (error) {
    res.status(500).json({ error: 'Error processing the request.' });
  }
});

//buy Stock API
app.post('/buy-stock', (req, res) => {
  const { user_id, stock_id, quantity } = req.body;

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

      const totalCost = stock.price * quantity;

      //check if the user has enough balance
      if (user.balance < totalCost) {
        return res.status(400).json({ error: 'Insufficient balance.' });
      }

      //deduct balance and insert the purchase
      db.run(
        'UPDATE users SET balance = balance - ? WHERE user_id = ?',
        [totalCost, user_id],
        (err) => {
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
        }
      );
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
//users balance API
app.get('/get-balance/:user_id', (req, res) => {
  const { user_id } = req.params;

  //validate input
  if (!user_id) {
    return res.status(400).json({ error: 'Invalid user ID.' });
  }

  //query the database for the user's balance
  db.get('SELECT balance FROM users WHERE user_id = ?', [user_id], (err, row) => {
    if (err) {
      console.error('Database error:', err.message);
      return res.status(500).json({ error: 'Error retrieving balance.' });
    }
    if (!row) {
      return res.status(404).json({ error: 'User not found.' });
    }

    //return only the balance
    res.status(200).json({ balance: row.balance });
  });
});



//export db for external use
module.exports = db;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
