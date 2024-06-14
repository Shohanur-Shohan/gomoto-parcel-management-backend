const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

//config
//middleware
app.use(express.json())
app.use(cors())



const uri = `mongodb+srv://${process.env.USER_NAME}:${process.env.USER_PASS}@cluster0.wis5xxo.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    //collections 
    const usersCollection = client.db("gomoto").collection("users");
    const bookedCollection = client.db("gomoto").collection("booked_info");

    //userType find
    app.get('/user/:email', async(req, res)=>{
      const userEmail = req?.params?.email;
      const query = {
        userEmail: userEmail,
      }
      const result = await usersCollection.findOne(query);
      res.send(result);
    })

    //send user to db
    app.post('/users', async(req, res)=>{
      const {user} = req.body;

      //checking user email exists or not in DB
      const query = {
        userEmail: user?.userEmail
      }
      const userExists = await usersCollection.findOne(query);
      if(userExists){
        res.send({ message: "Email already exists!", insertedId: null })
      }
      else{
        const result = await usersCollection.insertOne(user)
        res.send(result);
      }
    })

    //booking by user
    app.post('/parcel_booking', async (req, res)=>{
      const bookingInfo = req?.body;
      const result = await bookedCollection.insertOne(bookingInfo);
      res.send(result);
    })

    //user booked parcel data
    app.get('/user_booked_parcels/:email', async(req, res)=>{
        const userEmail = req?.params?.email;
        const query = {
          booked_user_email: userEmail,
        }

        const result = await bookedCollection.find(query).toArray();
        // console.log(result)
        res.send(result);
    })

    //find single booked data by id
    app.get('/find-booked-parcel/:id', async(req, res)=>{
      const ID = req?.params?.id;
      const query = {
        _id: new ObjectId(ID),
      }

      const result = await bookedCollection.findOne(query);
      res.send(result);
    })


    // update user booked parcel data
    app.patch('/update_booked_parcel/:email/:id', async (req, res)=>{
      const {email, id} = req?.params;
      const updatedInfo = req?.body;

      const filter = {
        _id: new ObjectId(id),
      }
      const options = { upsert: true };

      const updateDoc = {
        $set: updatedInfo,
      }
      const result = await bookedCollection.updateOne(filter, updateDoc, options);
    res.send(result);
    })



  } catch (error) {
    console.log(error)
  }
}
run();

app.listen(port, ()=>{
  console.log(`Example app listening on port ${port}`)
})
