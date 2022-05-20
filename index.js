const express = require('express');
const app = express();
const cors=require('cors')
const port = process.env.PORT||5000;
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');
const stripe= require('stripe')(process.env.STRIPE_SECRET_KEY);

//middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.v5rrv.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;


const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

//JWT verify function
const verifyJwt=(req,res,next)=>{
  const authHeader=req.headers.authorization;
  if(!authHeader){
    return res.status(401).send({message:'UnAuthorized Access'});
  }
  const token=authHeader.split(' ')[1];
  jwt.verify(token,process.env.ACCESS_TOKEN_SECRET, function(err, decoded) {
    if(err){
      return res.status(403).send({message:'Forbidden Access'});
    }
    req.decoded=decoded;
     next();
  });
}

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
      app.get('/booking',verifyJwt,async(req,res)=>{
        const getEmail=req.query.email;
        // console.log("From Inside Api",getEmail);
 
        const decodedEmail=req?.decoded.email;
        if(decodedEmail===getEmail){
          const query={Email:getEmail};
          const bookings= await bookingCollection.find(query).toArray();
          return res.send(bookings);
        }
        else{
          return res.status(403).send({message:'Forbidden User'})
        }
          
      });

      app.get('/booking/:id',verifyJwt,verifyJwt,async(req,res)=>{
        const id=req.params.id;
        const query={_id:ObjectId(id)};
        const bookingInfo=await bookingCollection.findOne(query);
        res.send(bookingInfo);
      });

      //Api for all users
      app.get('/user',verifyJwt,async(req,res)=>{
        const users=await userCollection.find().toArray();
        res.send(users);
      });

      //Api for verify admin
      app.get('/admin/:email',async(req,res)=>{
        const email=req.params.email;
        const user=await userCollection.findOne({email:email});
        const isAdmin=user.role==="Admin";
        res.send({admin:isAdmin});
      })

      //Api for making an user to admin
      app.put("/user/admin/:email",verifyJwt,async(req,res)=>{
        const email=req.params.email;
        
        const initiator=req?.decoded.email;
      const initiatorAccount=await userCollection.findOne({email:initiator});
        if(initiatorAccount.role==="Admin"){
          const filter={email:email};
          const updateDoc = {
            $set:{
              role:'Admin'
            }
          };
          const result= await userCollection.updateOne(filter,updateDoc);
         return res.send(result);
        }
       else{
        return res.status(403).send({message:'Forbidden'});
       }
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
        const token = jwt.sign({email:email},process.env.ACCESS_TOKEN_SECRET,{ expiresIn: '7d' });
        res.send({result,token});
      });

      //api for stripe payment 
      app.post("/create-payment-intent", async (req, res)=>{
        const service=req.body;
        const price=service.price;
        const amount=price*100;
        const paymentIntent = await stripe.paymentIntents.create({
          amount:amount,
          currency:'usd',
          payment_method_types: ["card"],
        });
        res.send({clientSecret: paymentIntent.client_secret});
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