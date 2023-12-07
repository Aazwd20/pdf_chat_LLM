const { MongoClient } = require("mongodb");

const uri = "mongodb://localhost:27017";
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
let db;

async function connectToMongo() {
  try {
    await client.connect();
    db = client.db("appdb");
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
  }
}

function getDb() {
  return db;
}

module.exports = { connectToMongo, getDb };
