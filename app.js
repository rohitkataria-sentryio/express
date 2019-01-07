const express = require('express');
const bodyParser = require("body-parser");
const cors = require('cors');
var app = express();

const Sentry = require('@sentry/node');

let Inventory = {
    wrench: {
        inventory: 0
    },
    nails: {
        inventory: 0
    },
    hammer: {
        inventory: 1
    }
};

let checkout = (cart) => {
    let tempInventory = Inventory;

    cart.forEach((item) => {
        if (tempInventory[item.id].inventory <= 0) {
            throw Error("No inventory for " + item.id);
        }
        tempInventory[item.id].inventory--;
    });

    // only gets here if we have enough inventory for all items. now update real inventory
    Inventory = tempInventory;
};

Sentry.init({ dsn: 'https://dddc44f682974e31af4331d292f3055c@sentry.io/300067'});

// The request handler must be the first middleware on the app
app.use(Sentry.Handlers.requestHandler());
app.use(bodyParser.json());
app.use(cors());

app.all('*', function (req, res, next) {
    let transactionId = req.header('X-Transaction-ID');
    if (transactionId) {
        console.log("transactionid is : " + transactionId);

        Sentry.configureScope(scope => {
            scope.setTag("transaction_id", transactionId);
            scope.setExtra("inventory", JSON.stringify( Inventory));
        });
    }
    next();
});

app.post('/checkout', function (req, res) {
    let order = req.body;

    console.log("Processing order for: " + order.email);
    checkout(order.cart);
    res.send('Success');
});

app.get('/capture-message', function (req, rest) {
    Sentry.captureMessage('Custom Message');
});

// The error handler must be before any other error middleware
app.use(Sentry.Handlers.errorHandler());

app.listen(3001, function () {
    console.log('CORS-enabled web server listening on port 3001');
});
