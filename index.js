const express = require('express');
const app = express();
const cors=require('cors')
const port = process.env.PORT||5000;
require('dotenv').config();
const { MongoClient, ServerApiVersion } = require('mongodb');
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

      //Api for loading data in Appointment Page
      app.get('/service',async(req,res)=>{
          const query={};
          const services= await serviceCollection.find(query).toArray();
          res.send(services);
      });
      app.get('/booking',async(req,res)=>{
          const query={};
          const bookings= await bookingCollection.find(query).toArray();
          res.send(bookings);
      });

      //Api for inseting bokking to db from input modal
      app.post('/service',async(req,res)=>{
          const query=req.body;
          const booking= await bookingCollection.insertOne(query);
          res.send(booking);
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