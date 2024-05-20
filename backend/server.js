import express from "express";
import bodyParser from "body-parser";
import cors from "cors";

const app = express();
const port = 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Generate One-Time Password (OTP)
function generateOTP() {
  // Generate a six-digit numeric OTP
  const otp = Math.floor(100000 + Math.random() * 900000);
  return otp.toString();
}

// Arrays for users, accounts, and sessions
const users = [];
const accounts = [];
const sessions = [];

// Create user endpoint
app.post("/users", (req, res) => {
  const { username, password } = req.body;
  const id = users.length + 1; //ID to the user
  const newUser = { id, username, password };
  users.push(newUser);

  console.log(newUser);

  const accountId = accounts.length + 1;
  const newAccount = { id: accountId, userId: id, amount: 0 };
  accounts.push(newAccount);

  console.log(newAccount);

  res.json({
    success: true,
    message: "User and account created successfully.",
  });
});

// Login endpoint
app.post("/sessions", (req, res) => {
  const { username, password } = req.body;
  const user = users.find(
    (user) => user.username === username && user.password === password
  );

  if (!user) {
    return res
      .status(401)
      .json({ success: false, message: "Invalid login credentials." });
  }

  // Create and save a session token for the user
  const token = generateOTP();
  sessions.push({ userId: user.id, token });

  res.json({ success: true, token }); // Return token to the client

  console.log(sessions);
});

// Show balance endpoint
app.post("/me/accounts", (req, res) => {
  const { token } = req.body;

  console.log("token", token); // For debugging

  const session = sessions.find((session) => session.token === token);

  if (!session) {
    return res
      .status(401)
      .json({ success: false, message: "Invalid session token." });
  }

  const userId = session.userId;
  const account = accounts.find((account) => account.userId === userId);

  if (!account) {
    return res
      .status(404)
      .json({ success: false, message: "Account not found for the user." });
  }

  res.json({ success: true, amount: account.amount });
  console.log(account);
});

// Deposit money endpoint
app.post("/me/accounts/transactions", (req, res) => {
  const { token, amount, otp } = req.body;

  const session = sessions.find((session) => session.token === token);
  if (!session) return res.status(401).json({ success: false, message: "Invalid session token." });

  const userId = session.userId;
  const user = users.find((user) => user.id === userId);
  if (!user) return res.status(401).json({ success: false, message: "Invalid authentication credentials." });

  const account = accounts.find((account) => account.userId === userId);
  if (!account) return res.status(404).json({ success: false, message: "Account not found for the user." });

  const sessionWithOTP = sessions.find(
    (session) => session.token === token && session.otp === otp
  );
  if (!sessionWithOTP) return res.status(401).json({ success: false, message: "Incorrect OTP." });

  const depositAmount = parseFloat(amount);
  if (isNaN(depositAmount) || depositAmount <= 0) {
    return res.status(400).json({ success: false, message: "Deposit amount must be a positive number." });
  }

  account.amount += depositAmount;

  res.json({ success: true, newBalance: account.amount });
});

// Start the server
app.listen(port, () => {
    console.log(`Bankens backend körs på http://localhost:${port}`)
});
