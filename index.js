const express = require('express');
const app = express();
const cors=require('cors')
const port = process.env.PORT||5000;
require('dotenv').config();
const { MongoClient, ServerApiVersion } = require('mongodb');
const jwt = require('jsonwebtoken');

//middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.v5rrv.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
      await client.connect();
      console.log("Mongo is connected to Doctor");

      const serviceCollection=client.db("doctors_portal").collection("service");
      const bookingCollection=client.db("doctors_portal").collection("booking");
      const userCollection=client.db("doctors_portal").collection("user");

      //Api for loading data in Appointment Page
      app.get('/service',async(req,res)=>{
          const query={};
          const services= await serviceCollection.find(query).toArray();
          res.send(services);
      });
      //Api for inseting bokking to db from input modal
      app.post('/booking',async(req,res)=>{
          const inputData=req.body;
          const query={Treatment:inputData.Treatment,Date:inputData.Date,Patient:inputData.Patient};
          const exist=await bookingCollection.findOne(query);
          if(exist){
            return res.send({success:false, data:exist});
          }
          const booking= await bookingCollection.insertOne(inputData);
          return res.send({success:true,booking});
      });
      
      //Api for loading all booking items filtering by email to dashboard
      app.get('/booking',async(req,res)=>{
        const getEmail=req.query.email;
        // console.log("From Inside Api",getEmail);
          const query={Email:getEmail};
          // console.log('From Query',query);
         
          const bookings= await bookingCollection.find(query).toArray();
          res.send(bookings);
      });

      //Api for upsert data into user db
      app.put("/user/:email",async(req,res)=>{
        const email=req.params.email;
        const filter={email:email};
        const options={upsert:true};
        const user=req.body;
        const updateDoc = {
          $set: user
        };
        const result= await userCollection.updateOne(filter,updateDoc,options);
        res.send(result);
      })

    } 
    finally {

    }
  }
  run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('Hello Doctor!')
})

app.listen(port, () => {
  console.log(`Doctor app listening on port ${port}`)
})