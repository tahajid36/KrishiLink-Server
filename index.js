const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const express = require("express");
const cors = require("cors");
const app = express();
require('dotenv').config();
const port = process.env.PORT || 1000;
const uri =`mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@bruce.s9kj5xo.mongodb.net/?appName=Bruce`;

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
  // to get all the posts with the user
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
    // to update the data from the modal
    // app.patch('/crops/:id', async(req, res)=> {
    //   const id = req.params.id;
    //   const query = {_id: new ObjectId(id)}
    //   const updatedUser = req.body
    //   console.log('after update', id, updatedUser)
    //   const update = {
    //     $set: updatedUser
    //   }
    //   const options = {}
    //   const result =await cropCollection.updateOne(query, update, options)
    //   res.send(result)
    // })
    // sending api to check one user cant send more than 1 interest





    app.put('/crops/:id', async (req, res) =>{
      const id = req.params.id
      const data = req.body
      const query = {_id: new ObjectId(id)}
      const updatedata = {
        $set: data
      }
      const result = await cropCollection.updateOne(query,updatedata)
      res.send(result)
    })

    //to post interest object to the interest array 
    app.post('/crops/interest/:cropId', async(req, res)=>{
      const id = req.params.cropId
      const interestId = new ObjectId()
      const interest = req.body;
      const newInterest = {_id: interestId, ...interest}
      console.log(newInterest)
      const result = await cropCollection.updateOne({
        _id: new ObjectId(id)
      }, {
        $push: {interests: newInterest}
      })
      res.send(result)
    })
    // to show all interest by an user 
    app.get('/interests', async (req, res)=>{
      const userEmail = req.query.email;
      const crops = await cropCollection.find({'interests.userEmail': userEmail}).toArray()
      const userinterest = []
      crops.forEach((crop)=> {
        const matchedInt = crop.interests.filter((u)=> u.userEmail === userEmail)
        matchedInt.forEach((interest)=>{
          userinterest.push({
            ...interest,
            cropName: crop.name,
            cropId: crop._id,
            cropOwner: crop.owner
          })
        })
      })
      res.send({interests: userinterest})
    })

    //to do the accept and reject btn task
    app.put('/crops/:cropId/interest/:interestId', async(req, res)=> {
      const {cropId, interestId} = req.params
      const {status} = req.body
      if(!['accepted', 'rejected'].includes(status)){
        return res.status(400).send({message: 'Invalid'})
      }
      const query = {_id: new ObjectId(cropId), 'interests._id': new ObjectId(interestId)}
      const update = {
        $set: {'interests.$.status': status}
      }
      const result = await cropCollection.updateOne(query, update)

      if(status === 'accepted' && result.modifiedCount > 0){
        const crop = await cropCollection.findOne({_id: new ObjectId(cropId)})
        const acceptedInterest = crop.interests.find(
          (int) => int._id.toString()=== interestId
        )
        if(acceptedInterest){
          const currrentQuantity = Number(crop.quantity)
          const reduceAmount = Number(acceptedInterest.quantity)
          const newQuantity = Math.max(currrentQuantity - reduceAmount, 0)

          await cropCollection.updateOne(
            {_id: new ObjectId(cropId)},
            {
              $set: {quantity: newQuantity}
            }
          )
        }
        
      }
      res.send(result)
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
