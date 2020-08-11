const express = require('express');
const app = express();
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
app.set("view engine", "hbs");
const hbs = require("hbs");
const urlencodedParser = bodyParser.urlencoded({extended: false});
app.use(cookieParser());

app.get('/', urlencodedParser, (req, res) => {

    res.render('profile.hbs', {
        avatar: 'none',
        username: 'username',
        status: 'status'
    });
});

console.log('listening');
console.log(process.env.PORT);
app.listen(2121);