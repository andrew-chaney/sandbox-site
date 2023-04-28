const axios = require('axios');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const express = require('express');
const session = require('express-session');
const app = express();

// Set variables for microservice addresses.
const USER_BASE_ADDR = process.env.USER_SERVER_BASE;

// Configure application.
app.set('view engine', 'ejs');

// Parse incoming data.
app.use(bodyParser.json());
app.use(
    bodyParser.urlencoded({
        extended: true,
    })
);

// Create session middleware.
app.use(
    session({
        secret: process.env.SESSION_SECRET,
        saveUninitialized: true,
        resave: true,
    })
);

// Session-based User Authentication.
const auth = (req, res, next) => {
    if (!req.session.user) {
        // Pages that require user to be logged in.
        if (['/home', '/logout'].includes(req.path)) {
            return res.redirect('/login');
        }
    }
    next();
};
app.use(auth);

// Routing.
app.get('/', (req, res) => {
    if (req.session.user) {
        res.redirect('/home');
    } else {
        res.redirect('/login');
    }
});

app.get('/login', (req, res) => {
    if (req.session.user) {
        res.redirect('/home');
    } else {
        res.render('login');
    }
});

app.post('/login', async (req, res) => {
    await axios
        .post(`${USER_BASE_ADDR}/login`, {
            'username': req.body.username,
            'password': req.body.password
        })
        .then((result) => {
            console.log('RESULT:');
            console.log(result);
            req.session.user = crypto.randomUUID();
            console.log('here0');
            req.session.save();
            console.log('here1');
            res.redirect('/home');
        })
        .catch((error) => {
            console.log('here2');
            if (error.response.status == 401) {
                console.log(error);
                console.log('here3');
                res.render('login', {
                    message: 'Invalid username or password.',
                    error: true
                });
            } else {
                console.log(error);
                console.log('here4');
                res.render('login', {
                    message: 'Server encountered an error. Please try again later.',
                    error: true
                });
            }
        });
});

app.get('/register', (_, res) => {
    res.render('register');
});

app.post('/register', async (req, res) => {
    await axios
        .post(`${USER_BASE_ADDR}/register`, {
            'username': req.body.username,
            'password': req.body.password
        })
        .then(() => {
            res.redirect('/login');
        })
        .catch((error) => {
            if (error.response.status == 401) {
                req.render('register', {
                    message: 'Username is already in use.',
                    error: true
                });
            } else {
                console.log(error);
                res.render('register', {
                    message: 'Server encountered an error. Please try again later.',
                    error: true
                });
            }
        });
});

app.get('/home', (_, res) => {
    res.render('home');
});

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login');
});

// For Testing
app.get('/users', async (req, res) => {
    console.log('Reaching out to user server...');
    await axios
        .get(`${USER_BASE_ADDR}/users`)
        .then((response) => {
            console.log(response);
        })
        .catch((error) => {
            console.log(error);
        });
});

// Spin up server.
const port = process.env.PORT;
app.listen(port);
console.log(`Server listening on port ${port}...`);