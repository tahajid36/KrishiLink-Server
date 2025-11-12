const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const express = require("express");
const cors = require("cors");
const app = express();
const port = process.env.PORT || 1000;
const uri =
  "mongodb+srv://bruce:xI9agTAQznbVVvYl@bruce.s9kj5xo.mongodb.net/?appName=Bruce";

// middlewares
app.use(cors());
app.use(express.json());

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    const db = client.db("krishilink");
    const cropCollection = db.collection("crops");

    //api to get all the crops to show them allas cards
    app.get("/crops", async (req, res) => {
      const cursor = cropCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    //api to post users crop post to all crops data

    app.post("/crops", async (req, res) => {
      const data = req.body;
      const result = await cropCollection.insertOne(data);
      res.send(result);
    });
    //to getting crop details by specific id
    app.get("/crops/:id", async (req, res) => {
      const id = req.params.id;
      const result = await cropCollection.findOne({ _id: new ObjectId(id) });
      res.send(result);
    });

    app.get("/mypost", async (req, res) => {
      const email = req.query.email;
      let query = {};
      if (email) {
        query = { "owner.ownerEmail": email };
      }
      const cursor = cropCollection.find(query);
      const result = await cursor.toArray();
      res.send({
        status: true,
        result,
      });
    });

    app.delete('/crops/:id',async (req, res)=>{
      const id = req.params.id
      const query = {_id: new ObjectId(id)}
      const result = await cropCollection.deleteOne(query)
      res.send(result)
    })

    app.put('/crops/:id', async (req, res) =>{
      const id = req.params.id
      const data = req.body
      const query = {_id: new ObjectId(id)}
      const updatedata = {
        $set: data
      }
      const result = await cropCollection.updateOne(query,updatedata)
    })

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`This server is running on port ${port}`);
});
