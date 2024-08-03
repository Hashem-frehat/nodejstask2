const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "test",
  password: "Hashem",
  port: 5432,
});
pool.connect();

pool.query("SELECT NOW()", (err, res) => {
  if (err) {
    console.error("Database connection error:", err);
  } else {
    console.log("Database connected successfully");
  }
});
const JWT_SECRET =
  "6b3a55e0261b034c70e5b16d8a572550e05c8c209e3a3c25d5a5db75d2bb2b4";

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (token == null) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};
app.post("/signup/", async (req, res) => {
  try {
    console.log("Received signup request:", req.body);
    const { username, password, first_name, last_name, email } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      "INSERT INTO USERS (USERNAME, PASSWORD, FIRST_NAME, LAST_NAME, EMAIL) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [username, hashedPassword, first_name, last_name, email]
    );

    console.log("User created successfully:", result.rows[0]);
    res.status(201).json({ message: "User created successfully" });
  } catch (error) {
    console.error("Error in signup:", error);
    console.error("Full error stack:", error.stack);
    res.status(500).json({ error: error.message, stack: error.stack });
  }
});

app.post("/login/", async (req, res) => {
  try {
    const { username, password } = req.body;
    const result = await pool.query("SELECT * FROM USERS WHERE USERNAME = $1", [
      username,
    ]);

    if (result.rows.length > 0) {
      const user = result.rows[0];
      if (await bcrypt.compare(password, user.password)) {
        const token = jwt.sign(
          { id: user.user_id, username: user.username },
          JWT_SECRET
        );
        res.json({ token });
      } else {
        res.status(400).json({ error: "Invalid credentials" });
      }
    } else {
      res.status(400).json({ error: "User not found" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
app.post("/tasks/", authenticateToken, async (req, res) => {
  try {
    console.log("تم استلام طلب إنشاء مهمة:", req.body);
    console.log("معرف المستخدم من الرمز:", req.user.id);
    const { task_name, task_description } = req.body;
    const userId = BigInt(req.user.id);
    const result = await pool.query(
      "INSERT INTO TASKS (TASK_NAME, TASK_DESCRIPTION, USER_ID) VALUES ($1, $2, $3) RETURNING *",
      [task_name, task_description, userId]
    );
    console.log("تم إنشاء المهمة بنجاح:", result.rows[0]);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("خطأ في إنشاء المهمة:", error);
    res.status(500).json({ error: error.message, stack: error.stack });
  }
});

app.get("/tasks/", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM TASKS WHERE USER_ID = $1", [
      req.user.id,
    ]);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put("/tasks/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { task_name, task_description } = req.body;
    const result = await pool.query(
      "UPDATE TASKS SET TASK_NAME = $1, TASK_DESCRIPTION = $2 WHERE TASK_ID = $3 AND USER_ID = $4 RETURNING *",
      [task_name, task_description, id, req.user.id]
    );
    if (result.rows.length > 0) {
      res.json(result.rows[0]);
    } else {
      res.status(404).json({ error: "Task not found" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete("/tasks/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      "UPDATE TASKS SET DELETED_AT = CURRENT_TIMESTAMP WHERE TASK_ID = $1 AND USER_ID = $2 RETURNING *",
      [id, req.user.id]
    );
    if (result.rows.length > 0) {
      res.json({ message: "Task deleted successfully" });
    } else {
      res.status(404).json({ error: "Task not found" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 4020;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
