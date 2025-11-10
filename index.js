const express = require("express");
require("dotenv").config();
const admin = require("firebase-admin");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const port = 5000;

app.use(express.json());
app.use(cors());

const serviceAccount = require("./firebase-admin.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const firebaseCheckToken = async (req, res, next) => {
  const authorization = req.headers.authorization;

  
  if (!authorization) {
    return res
      .status(401)
      .send({ message: "No authorization header provided" });
  }

  const token = authorization.split(" ")[1];
//   console.log(token)

  
  if (!token) {
    return res.status(401).send({ message: "No token found in header" });
  }

  try {
    // 🔹 Step 3: Verify token
    const decoded = await admin.auth().verifyIdToken(token);
    req.token_email = decoded.email;
    // console.log("✅ Token verified for:", decoded.email);
    next();
  } catch (e) {
    // 🔹 Step 4: Handle invalid token
    return res.status(401).send({ message: "Invalid or expired token" });
  }
};


const user = process.env.USER_NAME;
const password = process.env.USER_PASSWORD;

const uri = `mongodb+srv://${user}:${password}@cluster0.g6tkuix.mongodb.net/?appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true
  },
});

async function run() {
  try {
    await client.connect();

    const database = client.db("Assignment10DB");

    const AddCollection = database.collection("add");

    // post new transaction into database

    app.post("/add", async (req, res) => {
      const data = req.body;
      const result = await AddCollection.insertOne(data);
      res.send(result);
    });

    // get data base into data

    app.get("/add", firebaseCheckToken, async (req, res) => {
      try {
        const email = req.query.email;
        const email1 = req.token_email;
        console.log(email1);
        if (email !== email1) {
          return res.status(401).send({ message: "Something went wrong " });
        }

        if (!email) {
          return res.status(400).send({ message: "Email doesn't exist" });
        }
        const result = await AddCollection.find({ email }).toArray();
        res.send(result);
      } catch (error) {
        res.status(500).send({ message: "Something went wrong " });
      }
    });

    //get specific data from database;
    app.get("/add/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const email = req.query.email;

        const query = { _id: new ObjectId(id) };
        const result = await AddCollection.findOne(query);
        // if(email!==req.token_email){
        //     return res.status(403).send({message:"Unauthorized User "})
        // }

        res.send(result);
      } catch (error) {
        res.status(500).send({ message: "Unauthorized user " });
      }
    });

    // ✅ Delete transaction
    app.delete("/add/delete/:id", firebaseCheckToken, async (req, res) => {
      try {
        const id = req.params.id;
        const email = req.query.email;

        if (email !== req.token_email) {
          return res.status(403).send({ message: "Unauthorized User" });
        }

        const query = { _id: new ObjectId(id) };
        const result = await AddCollection.deleteOne(query);

        if (result.deletedCount === 0) {
          return res.status(404).send({ message: "Transaction not found" });
        }

        res.send({
          success: true,
          deletedCount: result.deletedCount,
          message: "Transaction deleted successfully",
        });
      } catch (error) {
        console.error("Delete error:", error);
        res.status(500).send({ message: "Server error while deleting" });
      }
    });




    // update specific transaction
    app.patch("/add/update/:id", firebaseCheckToken, async (req, res) => {
      try {
        const updateTransaction = req.body;
        const id = req.params.id;
        const email = req.query.email;
        const query = { _id: new ObjectId(id) };
        if (email !== req.token_email) {
          return res.status(403).send({ message: "Unauthorized User " });
        }
        const update = {
          $set: updateTransaction,
        };
        const result = await AddCollection.updateOne(query, update);
        res.send(result);
      } catch (e) {
        return res.status(403).send({ message: "Unauthorized User " });
      }
    });

    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("  this is assignment 10 !");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
