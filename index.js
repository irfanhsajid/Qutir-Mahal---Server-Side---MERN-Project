const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { MongoClient } = require('mongodb');
const ObjectId = require("mongodb").ObjectId;

const app = express();
const port = process.env.PORT || 5000;
//middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.vaopm.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

async function run() {
    try {
        await client.connect();
        const productsCollection = client.db("Qutir-Shop").collection("products");
        const ordersCollection = client.db("Qutir-Shop").collection("orders");
        const usersCollection = client.db("Qutir-Shop").collection("users");
        console.log('database is connected successfully');

        //products api
        app.get('/products', async (req, res) => {
            const result = await productsCollection.find({}).toArray();
            res.send(result);
        })
        //My Orders Post method
        app.post('/addOrder', (req, res) => {
            // console.log(req.body);
            ordersCollection.insertOne(req.body).then(result => {
                console.log(result);
                res.send(result.insertedId);
            })
        });
        //get my orders
        app.get('/orders', async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const result = await ordersCollection.find(query).toArray();
            res.send(result);
        })
        //delete Orders
        app.delete('/deleteOrder/:id', async (req, res) => {
            // console.log(req.params.id);
            const result = await ordersCollection.deleteOne({ _id: ObjectId(req.params.id) });
            // console.log(result);
            res.send(result);
        });

        app.get('/users/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email }
            const user = await usersCollection.findOne(query);
            let isAdmin = false;
            if (user?.role === 'admin') {
                isAdmin = true;
            }
            res.json({ admin: isAdmin });
        })

        //users post method
        app.post('/users', async (req, res) => {
            const user = req.body;
            const result = await usersCollection.insertOne(user)
            console.log(result);
            res.send(result);
        })

        //upsert users 
        app.put('/users', async (req, res) => {
            const user = req.body;
            const filter = { email: user.email };
            const options = { upsert: true };
            const updateDoc = { $set: user };
            const result = await usersCollection.updateOne(filter, updateDoc, options);
            res.json(result);
        });

        app.put('/users/admin', async (req, res) => {
            const user = req.body;
            console.log('put', user);
            const filter = { email: user.email };
            const updateDoc = { $set: { role: 'admin' } };
            const result = await usersCollection.updateOne(filter, updateDoc);
            res.json(result);
        })

    }
    finally {
        // await client.close();
    }
}
run().catch(console.dir);
app.get('/', (req, res) => {
    res.send('Qutir Mahal Server is running');
})

app.listen(port, () => {
    console.log('listening from the port', port);
})