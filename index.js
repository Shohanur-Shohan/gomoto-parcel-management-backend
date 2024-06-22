const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

//config
//middleware
app.use(cors())
app.use(express.json())



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
    const deliveryMenCollection = client.db("gomoto").collection("all_delivery_men");

    //convert date strings to Date objects
    // const parseDate = (dateStr) => {
    //   return parse(dateStr, "MMMM do, yyyy", new Date());
    // };

    // preprocess date strings
    // const preprocessDate = (dateStr) => {
    //   return dateStr.replace(/(\d+)(th|rd|nd|st)/, '$1');
    // };

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
      // console.log(user?.user_type)
      const query = {
        userEmail: user?.userEmail
      }
      const userExists = await usersCollection.findOne(query);
      if(userExists){
        res.send({ message: "Email already exists!", insertedId: null })
      }
      else{
        const result = await usersCollection.insertOne(user);
        if(user?.user_type === "delivery_men"){
          await deliveryMenCollection.insertOne({...user, parcel_delivered: [], reviews: [], user_phone: user?.user_phone})
        }
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
    app.get('/user_booked_parcels/:email/:filterStatus', async(req, res)=>{
        const userEmail = req?.params?.email;
        const Status = req?.params?.filterStatus;

        if(Status === "all"){
          const query = {
            booked_user_email: userEmail,
          }
          const result = await bookedCollection.find(query).toArray();
          res.send(result);

        }
        else{
          const query = {
            booked_user_email: userEmail,
            status: Status
          }
          const result = await bookedCollection.find(query).toArray();
          res.send(result);
        }
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

    //cancel user booked parcel data
    app.patch('/cancel_booked_parcel/:email/:id', async (req, res)=>{
      const {email, id} = req?.params;
      const filter = {
        _id: new ObjectId(id)
      }
      const options = { upsert: true };

      const updateDoc = {
        $set: {
          status: "cancelled"
        },
      }
      const result = await bookedCollection.updateOne(filter, updateDoc, options);
      res.send(result);
    })

    //all deliveryMen
    app.get('/allDeliveryMen', async (req, res)=>{

      const result = await deliveryMenCollection.find().toArray();
      res.send(result);
    })

    //all parcels
    app.get('/allParcels', async (req, res)=>{
      const result = await bookedCollection.find().toArray();
      res.send(result);
    })

    // update user booked parcel data by admin
    app.patch('/update_booked_parcel_byadmin/:email/:id', async (req, res)=>{
      const {email, id} = req?.params;
      const updatedData = req?.body;

      const filter = {
        _id: new ObjectId(id),
      }
      const options = { upsert: true };

      const updateDoc = {
        $set: updatedData,
      }
      const result = await bookedCollection.updateOne(filter, updateDoc, options);
    res.send(result);
    })

    //search by date
    app.post('/searchByDate', async (req, res)=>{
      const { dateFrom, dateTo } = req?.body;

     
      res.send([]);
    })

    //all users list
    app.get('/allUsersList', async (req, res) => {
      const currentPage = parseInt(req.query.currentPage) || 0;
      const itemsPerPage = 5;
    
      const query = { user_type: "user" };
    
      // Get the total number of users
      const totalItems = await usersCollection.countDocuments(query);
      const users = await usersCollection.find(query)
        .skip(currentPage * itemsPerPage)
        .limit(itemsPerPage)
        .toArray();
    
      res.send({ totalItems, users });
    });
    

    //change user type
    app.patch('/changeUserType/:id', async (req, res)=>{
      const {changetype, updatedInfo} = req?.body;
      const id = req.params?.id
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };

      const updateDoc = {
        $set: {
          user_type: changetype
        },
      };
      const query = { booked_user_email: updatedInfo?.userEmail };

      if(changetype === "delivery_men"){
        const result = await usersCollection.updateOne(filter, updateDoc, options);
        await deliveryMenCollection.insertOne(updatedInfo);
        await bookedCollection.deleteMany(query);
        
        res.send(result);
      }
      else{
        const result = await usersCollection.updateOne(filter, updateDoc, options);
        await bookedCollection.deleteMany(query);
        res.send(result);
      }
    })

    //deliveyList
    app.get('/deliveryList/:email', async(req, res)=>{
      const deliveryMenEmail = req?.params?.email;

      const query = { 
        userEmail: deliveryMenEmail
      }
      const result = await deliveryMenCollection.findOne(query);
      const deliveryMenId = result?._id.toString();

      if(deliveryMenId){
        //query2
        const query2 = {     
          delivery_men_id: deliveryMenId
        }
        const result2 = await bookedCollection.find(query2).toArray();
        res.send(result2);
      }
      else{
        res.send([]);
      }

    })

    //update booked parcel by deliverymen
    app.patch('/updateBookedParcel/:email/:id', async (req, res)=>{
      const {email, id} = req?.params;
      const updatedData = req?.body;

      const filter = {
        _id: new ObjectId(id),
      }
      const options = { upsert: true };

      const updateDoc = {
        $set: {
          status: updatedData?.status,
        }
      }
      const result = await bookedCollection.updateOne(filter, updateDoc, options);
      if(updatedData?.status === "delivered"){
        const filter2 = {  
          userEmail: email,
        }
        const query2 = {
          $push: {
            parcel_delivered: id
          }
        }
        await deliveryMenCollection.updateOne(filter2, query2, options)
      }
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
