const express = require('express');
const bodyParser = require("body-parser");
const Database = require('better-sqlite3');
const db = new Database('./mess.db');
const app = express();
const cookieParser = require("cookie-parser");
const urlencodedParser = bodyParser.urlencoded({extended: false});

app.set("view engine", "hbs");
app.use(cookieParser());

app.get('/', urlencodedParser, (req, res) => {
    let username = req.cookies.username;
    let password = req.cookies.password;
    let passworddb;

    try {
        let sql1 = db.prepare('SELECT password FROM users WHERE username = ?');
        passworddb = sql1.get(username).password;
    } catch(e) {
        res.sendFile(__dirname + '/registration.html');
        return;
    }

    if(username == '') {
        res.sendFile(__dirname + '/registration.html');
        return;
    } else if(String(username).length < 5) {
        res.sendFile(__dirname + '/registration.html');
        return;
    }

    if(String(passworddb) == String(password)) {

        let dialogs;
        try {
            let sql2 = db.prepare(`SELECT * FROM dialogs_${username}_`);
            dialogs = sql2.all();
        } catch(e) {
            console.log(e)
        }

        res.render('dialogs.hbs', {
            dialogs: dialogs
        });
    } else {
        res.sendFile(__dirname + '/registration.html');
    }

});

app.get('/exit', urlencodedParser, (req, res) => {
    res.cookie('username', '');
    res.cookie('password', '');

    res.redirect('/')
});

app.post('/send_message', urlencodedParser, (req, res) => {

    let content = req.body.content;
    let username = req.cookies.username;
    let profile = req.body.who;
    let from = req.body.from;

    let aavatar;
    let avatar;

    let firsttime = new Date;
    let day = firsttime.getDate();
    let month = firsttime.getMonth();
    let year = firsttime.getFullYear();
    let hour = firsttime.getHours();
    let minute = firsttime.getMinutes();

    if(day <= 9) {
        day = `0${day}`;
    }
    if(month <= 9) {
        month = `0${month}`;
    }
    if(minute <= 9) {
        minute = `0${minute}`;
    }

    let time = `${day}.${month}.${year} ${hour}:${minute}`;

    try {
        let sql1 = db.prepare(`SELECT avatar FROM users WHERE username = ?`);
        aavatar = sql1.get(username).avatar;
        let sql2 = db.prepare(`SELECT avatar FROM users WHERE username = ?`);
        avatar = sql2.get(profile).avatar;
    } catch(e) {
        console.log(e)
    }

    if(from == username) {
        try {
            let sql3 = db.prepare(`INSERT INTO messages_${profile}_${username} (username, avatar, content, time) VALUES (?, ?, ?, ?)`);
            sql3.run(username, aavatar, content, time);
            let sql4 = db.prepare(`INSERT INTO messages_${username}_${profile} (username, avatar, content, time) VALUES (?, ?, ?, ?)`);
            sql4.run(username, aavatar, content, time);
        } catch (e) {
            console.log(e);
            return;
        }
    } else {
        try {
            let sql5 = db.prepare(`INSERT INTO messages_${profile}_${username} (username, avatar, content, time) VALUES (?, ?, ?, ?)`);
            sql5.run(profile, avatar, content, time);
            let sql6 = db.prepare(`INSERT INTO messages_${username}_${profile} (username, avatar, content, time) VALUES (?, ?, ?, ?)`);
            sql6.run(profile, avatar, content, time);
        } catch (e) {
            console.log(e);
            return;
        }  
    }
    

    res.redirect('/messages/' + profile + '/');
});

app.get('/messages/:name', urlencodedParser, (req, res) => {
    let username = req.cookies.username;
    let password = req.cookies.password;
    let passworddb;
    let profile = req.params.name;

    try {
        let sql1 = db.prepare('SELECT password FROM users WHERE username = ?');
        passworddb = sql1.get(username).password;
    } catch(e) {
        console.log(e)
    }

    if(String(passworddb) == String(password)) {

        let messages;
        try {
            let sql2 = db.prepare(`SELECT * FROM messages_${username}_${profile}`);
            messages = sql2.all();
        } catch(e) {
            console.log(e)
        }

        res.render('messages.hbs', {
            messages: messages,
            who: profile,
            from: username
        });
    } else {
        res.sendFile(__dirname + '/registration.html');
    }
});

app.post('/login', urlencodedParser, (req, res) => {
    let username = req.body.username;
    let password = req.body.passwd;
    let passworddb;

    try {
        let sql1 = db.prepare('SELECT password FROM users WHERE username = ?');
        passworddb = sql1.get(username).password;
    } catch(e) {
        console.log(e)
    }
    
    if(String(passworddb) == String(password)) {
        res.cookie('username', username);
        res.cookie('password', password);
        res.redirect('/profile');
    } else {
        res.redirect('/');
    }
    
});

app.get('/profile/:name', urlencodedParser, (req, res) => {
    console.log(req.params.name);
    let username = req.params.name;
    let sql = db.prepare('SELECT avatar FROM users WHERE username = ?');
    let avatar = sql.get(username).avatar;

    res.render('MessOther.hbs', {
        avatar: avatar,
        username: username,
    });
});

app.get('/create_dialog/:name', urlencodedParser, (req, res) => {
    let profile = req.params.name;
    let username = req.cookies.username;
    let aavatar;
    let avatar;

    try {
        let sql1 = db.prepare('SELECT avatar FROM users WHERE username = ?');
        avatar = sql1.get(profile).avatar;
        let sql2 = db.prepare('SELECT avatar FROM users WHERE username = ?');
        aavatar = sql2.get(username).avatar;
    } catch(e) {
        console.log(e);
        return;
    }

    try {
        let sql = db.prepare(`INSERT INTO dialogs_${username}_ (username, avatar) VALUES (?, ?)`);
        sql.run(profile, avatar);
        let sql5 = db.prepare(`CREATE TABLE messages_${username}_${profile} (id INTEGER PRIMARY KEY AUTOINCREMENT, username VARCHAR (50), avatar VARCHAR (250), content VARCHAR (500), time VARCHAR (50))`);
        sql5.run();
    } catch (e) {
        console.log(e);
        res.redirect('/');
        return;
    }

    try {
        let sql3 = db.prepare(`INSERT INTO dialogs_${profile}_ (username, avatar) VALUES (?, ?)`);
        sql3.run(username, aavatar);
        let sql4 = db.prepare(`CREATE TABLE messages_${profile}_${username} (id INTEGER PRIMARY KEY AUTOINCREMENT, username VARCHAR (50), avatar VARCHAR (250), content VARCHAR (500), time VARCHAR (50))`);
        sql4.run();
    } catch (e) {
        console.log(e);
        res.redirect('/');
        return;
    }

    res.redirect('/');
});

app.get('/add_friend/:name', urlencodedParser, (req, res) => {

    let username = req.cookies.username;
    let profile = req.params.name;
    let avatar;
    let aavatar;

    let sql = db.prepare('SELECT avatar FROM users WHERE username = ?');
    avatar = sql.get(profile).avatar;
    let sql1 = db.prepare('SELECT avatar FROM users WHERE username = ?');
    aavatar = sql1.get(username).avatar;

    try {
        let sql2 = db.prepare(`INSERT INTO friends_${username}_ (username, avatar) VALUES (?, ?)`);
        sql2.run(profile, avatar);
        let sql3 = db.prepare(`INSERT INTO friends_${profile}_ (username, avatar) VALUES (?, ?)`);
        sql3.run(username, aavatar);
    } catch (error) {
        res.redirect('/friends');
        return;
    }
    

    res.redirect('/friends');
});

app.get('/profile', urlencodedParser, (req, res) => {

    let username = req.cookies.username;
    let sql = db.prepare('SELECT avatar FROM users WHERE username = ?');
    let avatar = sql.get(username).avatar;

    res.render('MessProfile.hbs', {
        avatar: avatar,
        username: username,
    });
});

app.get('/search', urlencodedParser, (req, res) => {
    let username = req.cookies.username;
    let persons;

    try {
        let sql = db.prepare('SELECT * FROM users');
        persons = sql.all();
    } catch (e) {
        
    }

    res.render('find.hbs', {
        persons: persons
    });
});

app.get('/friends', urlencodedParser, (req, res) => {
    let username = req.cookies.username;
    let persons;

    try {
        let sql = db.prepare(`SELECT * FROM friends_${username}_`);
        persons = sql.all();
    } catch (e) {
        
    }

    res.render('friends.hbs', {
        persons: persons
    });
});

app.post('/search_user/', urlencodedParser, (req, res) => {
    let username = req.cookies.username;
    let person = req.body.person;
    let persons;

    console.log(person);

    try {
        let sql = db.prepare('SELECT * FROM users WHERE username = ?');
        persons = sql.all(person);
    } catch (e) {
        
    }

    res.render('find.hbs', {
        persons: persons
    });
});

app.get('/reico', urlencodedParser, (req, res) => {
    let username = req.cookies.username;
    let sql = db.prepare('SELECT avatar FROM users WHERE username = ?');
    let avatar = sql.get(username).avatar;

    res.render('reico.hbs', {
        avatar: avatar,
    });
});

app.post('/reico', urlencodedParser, (req, res) => {
    let username = req.cookies.username;
    let newavatar = String(req.body.newico);
    try {
        let sql = db.prepare('UPDATE users SET avatar = ? WHERE username = ?');
        sql.run(newavatar, username);
    } catch(e) {
        console.log(e)
    }
    res.redirect('/profile');
});

app.get('/log', (req, res) => {
    res.render('login.hbs');
});

app.get('/reg(.html)?', (req, res) => {
    res.sendFile(__dirname + '/registration.html');
});

app.post('/reg', urlencodedParser, (req, res) => {
    let username = String(req.body.username);
    let passwd = String(req.body.passwd);
    if(username.length < 5) {
        return;
    } else if (passwd.length < 5) {
        return;
    } else {
        try {
            let sql = db.prepare('INSERT INTO users (username, password) VALUES (?, ?)');
            sql.run(username, passwd);
            let sql1 = db.prepare('CREATE TABLE friends_' + username + '_ (id INTEGER PRIMARY KEY AUTOINCREMENT, username VARCHAR (50) UNIQUE, avatar VARCHAR (250))');
            sql1.run();
            let sql3 = db.prepare('CREATE TABLE dialogs_' + username + '_ (id INTEGER PRIMARY KEY AUTOINCREMENT, username VARCHAR (50) UNIQUE, avatar VARCHAR (250))');
            sql3.run();
            res.cookie('username', username);
            res.cookie('password', passwd);
        } catch(e) {
            console.log(e);
            return;
        }
        res.redirect('/profile');
        return;
    }
});

console.log('listening');
app.listen(process.env.PORT || 3000);