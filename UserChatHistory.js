const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const { MongoClient } = require("mongodb");

const app = express();
const port = 3081; // You can choose a different port

app.use(bodyParser.json());
app.use(cors());

// MongoDB connection string
const mongoURI =
  "mongodb+srv://asiflzwd:asiflzwd123@cluster0.gpdaa5w.mongodb.net/";
const client = new MongoClient(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function connectToMongoDB() {
  try {
    await client.connect();
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
  }
}

connectToMongoDB();

// Endpoint to fetch all user chats
app.get("/userchats/:user_id", async (req, res) => {
  const { user_id } = req.params;
  try {
    const db = client.db("appdb_online");
    const collection = db.collection("aiqus");
    const userChats = await collection.find({ user_id }).toArray();
    res.json({ success: true, chats: userChats });
  } catch (error) {
    console.error("Error fetching user chats:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// Endpoint to fetch messages for a specific chat
app.get("/userchats/:user_id/:chat_name/messages", async (req, res) => {
  const { user_id, chat_name } = req.params;
  try {
    const db = client.db("appdb_online");
    const collection = db.collection("aiqus");
    const chatMessages = await collection.findOne({ user_id, chat_name });
    res.json({ success: true, messages: chatMessages.conversation || [] });
  } catch (error) {
    console.error("Error fetching chat messages:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

app.listen(port, () => {
  console.log(
    `User Chat History server is running at http://localhost:${port}`
  );
});
