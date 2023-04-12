const mongoClient = require('mongodb').MongoClient;
const bodyParser = require('body-parser');
const express = require('express');

var db;
var usersDB;
var mongoConnected = false;


const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.post('/login', (req, res) => {
    if (mongoConnected) {
        usersDB.findOne({
            username: req.body.username,
        }).then((user) => {
            req.log.info('user', user);
            if (user) {
                if (user.password == req.body.password) {
                    res.json(user);
                } else {
                    // For testing only, remove later.
                    res.status(404).send('Incorrect password.');
                }
            } else {
                res.status(404).send('Username not found.');
            }
        }).catch((e) => {
            console.log(`ERROR: ${e}`)
            res.status(500).send(e);
        });
    } else {
        console.log("Error connecting to the database.");
        res.status(500).send('Error connecting to the database.');
    }
});

app.post('/register', (req, res) => {
    if (mongoConnected) {
        usersDB.findOne({ username: req.body.username }).then((user) => {
            if (user) {
                req.log.warn("Username already exists.");
                res.status(400).send("Username already exists.");
            } else {
                usersDB.insertOne({
                    username: req.body.username,
                    password: req.body.password
                }).then((r) => {
                    console.log("New user added.");
                    res.send('Registration successful.');
                }).catch((e) => {
                    console.log(`ERROR: ${e}`)
                    res.status(500).send(e);
                });
            }
        }).catch((e) => {
            console.log(`ERROR: ${e}`);
            res.status(500).send(e);
        });
    } else {
        console.log("Error connecting to the database.");
        res.status(500).send("Error connecting to the database.");
    }
});

// For testing only. Remove later.
// app.get("/users", (_, res) => {
//     console.log("Request made to get all users.");
//     if (mongoConnected) {
//         usersDB.find().toArray().then((users) => {
//             res.json(users);
//         }).catch((e) => {
//             console.log(`ERROR: ${e}`);
//             res.status(500).send(e);
//         });
//     } else {
//         console.log("Error connecting to the database.");
//         res.status(500).send("Error connecting to the database.");
//     }
// });

function mongoConnect() {
    return new Promise((resolve, reject) => {
        var mongoURL = process.env.MONGO_URL;
        mongoClient.connect(mongoURL, (error, client) => {
            if (error) {
                reject(error);
            } else {
                db = client.db("users");
                usersDB = db.collection("users");
                resolve("Connected");
            }
        });
    });
}

function establishMongoConnection() {
    mongoConnect().then((r) => {
        mongoConnected = true;
        console.log("Connected to MongoDB.");
    }).catch((e) => {
        console.log(`ERROR: ${e}`);
        setTimeout(establishMongoConnection, 2000);
    });
}

establishMongoConnection();

const port = process.env.USER_SERVER_PORT;
app.listen(port, () => {
    console.log(`Server running on port ${port}.`);
});