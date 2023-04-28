const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');
const express = require('express');
const mongoClient = require('mongodb').MongoClient;

var db;
var usersDB;
var mongoConnected = false;

const app = express();

app.use(bodyParser.json());
app.use(
    bodyParser.urlencoded({
        extended: true
    })
);

app.post('/login', (req, res) => {
    if (mongoConnected) {
        usersDB.findOne({
            username: req.body.username
        }).then(async (user) => {
            if (user) {
                const match = await bcrypt.compare(req.body.password, user.password);
                if (match) {
                    res.status(200).send();
                } else {
                    res.status(401).send();
                }
            } else {
                res.status(401).send();
            }
        }).catch((e) => {
            console.log(`ERROR: ${e}`)
            res.status(500).send();
        });
    } else {
        console.log('Error connecting to the database.');
        res.status(500).send();
    }
});

app.post('/register', (req, res) => {
    if (mongoConnected) {
        usersDB.findOne({ username: req.body.username }).then(async (user) => {
            if (user) {
                req.log.warn('Username already exists.');
                res.status(400).send();
            } else {
                const hash = await bcrypt.hash(req.body.password, 10);
                usersDB.insertOne({
                    username: req.body.username,
                    password: hash
                }).then((r) => {
                    res.status(200).send();
                }).catch((e) => {
                    console.log(`ERROR: ${e}`)
                    res.status(500).send();
                });
            }
        }).catch((e) => {
            console.log(`ERROR: ${e}`);
            res.status(500).send();
        });
    } else {
        console.log('Error connecting to the database.');
        res.status(500).send();
    }
});

// For testing only. Remove later.
app.get('/users', (_, res) => {
    console.log('Request made to get all users.');
    if (mongoConnected) {
        usersDB.find().toArray().then((users) => {
            res.json(users);
        }).catch((e) => {
            console.log(`ERROR: ${e}`);
            res.status(500).send();
        });
    } else {
        console.log('Error connecting to the database.');
        res.status(500).send();
    }
});

function mongoConnect() {
    return new Promise((resolve, reject) => {
        var mongoURL = process.env.MONGO_URL;
        mongoClient.connect(mongoURL, (error, client) => {
            if (error) {
                reject(error);
            } else {
                db = client.db('users');
                usersDB = db.collection('users');
                resolve('Connected');
            }
        });
    });
}

function establishMongoConnection() {
    mongoConnect().then((r) => {
        mongoConnected = true;
        console.log('Connected to MongoDB.');
    }).catch((e) => {
        console.log(`ERROR: ${e}`);
        setTimeout(establishMongoConnection, 2000);
    });
}

establishMongoConnection();

const port = process.env.PORT;
app.listen(port, () => {
    console.log(`Server running on port ${port}.`);
});