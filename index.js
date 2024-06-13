const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();
const port = process.env.PORT || 5000;

//config
//middleware
app.use(express.json())
app.use(cors())


const { MongoClient, ServerApiVersion } = require('mongodb');
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

    


  } catch (error) {
    console.log(error)
  }
}
run();

app.listen(port, ()=>{
  console.log(`Example app listening on port ${port}`)
})
