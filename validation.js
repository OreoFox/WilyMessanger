const express = require('express');
const bodyParser = require("body-parser");
const Database = require('better-sqlite3');
const db = new Database('./users.db');
const app = express();
const cookieParser = require("cookie-parser");

const urlencodedParser = bodyParser.urlencoded({extended: false});

app.set("view engine", "hbs");
const hbs = require("hbs");
hbs.registerHelper("ifeq", function(a, b, opts) {
    if (a == b) {
        return opts.fn(this);
    } else {
        return opts.inverse(this);
    }
});
app.use(cookieParser());

app.get('/profile', urlencodedParser, (req, res) => {

    let username = req.cookies.username;
    let sql = db.prepare('SELECT avatar FROM users WHERE username = ?');
    let avatar = sql.get(username).avatar;
    let sql1 = db.prepare('SELECT status FROM users WHERE username = ?');
    let status = sql1.get(username).status;

    res.render('profile.hbs', {
        avatar: avatar,
        username: username,
        status: status
    });
});

app.get('/themes', urlencodedParser, (req, res) => {

    let sql1 = db.prepare('SELECT * FROM themes');
    let themes = sql1.all();

    res.render('themes.hbs', {
        themes: themes
    });
});

app.get('/createtheme', urlencodedParser, (req, res) => {
    res.render('createtheme.hbs');
});

app.get('/theme/spec/:themename/next/:entryname', urlencodedParser, (req, res) => {

    let themename = req.params.themename;
    let entryname = req.params.entryname;
    let messages;
    let sql1 = db.prepare('SELECT * FROM ' + themename);
    messages = sql1.all();
    console.log(messages);

    res.render('entry.hbs', {
        entryname: entryname,
        themename: themename,
        messages: messages
    });
});

app.get('/theme/createentry/:name', urlencodedParser, (req, res) => {
    let name = req.params.name;
    res.render('createentry.hbs', {
        themename: name
    });
});

app.get('/theme/spec/:name/', urlencodedParser, (req, res) => {
    let alltheme;
    let themename = req.params.name;
    let sql1 = db.prepare('SELECT * FROM themes WHERE name = ?');
    alltheme = sql1.all(themename)[0];

    let name = alltheme.name;
    let desc = alltheme.desc;
    let icon = alltheme.icon;
    let author = alltheme.author;

    let entrys;
    let sql2 = db.prepare('SELECT * FROM ' + themename + 'entry');
    entrys = sql2.all();

    res.render('spectheme.hbs', {
        names: name,
        descs: desc,
        ico: icon,
        author: author,
        entrys: entrys
    });
});

app.post('/theme/createentry', urlencodedParser, (req, res) => {

    let author = req.cookies.username;
    let password = req.cookies.password;
    let name = req.body.name;
    let description = req.body.descr;
    let themename = req.body.themename;

    let sql1 = db.prepare('SELECT password FROM users WHERE username = ?');
    let passworddb = sql1.get(author).password;

    if(passworddb == password) {
        let sql = db.prepare('INSERT INTO ' + themename + 'entry (author, name, desc, theme) VALUES (?, ?, ?, ?)');
        sql.run(author, name, description, themename);
    }

    res.redirect('/theme/spec/' + themename);
    
});

app.post('/createtheme', urlencodedParser, (req, res) => {

    let author = req.cookies.username;
    let password = req.cookies.password;
    let name = req.body.name.split(' ')[0];
    let icon = req.body.ico;
    let description = req.body.descr;
    let dbname = name.split(' ')[0];

    let sql1 = db.prepare('SELECT password FROM users WHERE username = ?');
    let passworddb = sql1.get(author).password;

    if(passworddb == password) {
        let sql = db.prepare('INSERT INTO themes (name, desc, icon, author) VALUES (?, ?, ?, ?)');
        sql.run(name, description, icon, author);

        let sql2 = db.prepare('CREATE TABLE ' + dbname + ' (id INTEGER PRIMARY KEY AUTOINCREMENT, aname VARCHAR (100), aavatar VARCHAR (500), mcontent VARCHAR (500), time VARCHAR (50))');
        sql2.run();
    }

    res.redirect('/themes');
    
});

app.get('/profile/:name', urlencodedParser, (req, res) => {
    console.log(req.params.name);
    let username = req.params.name;
    let sql = db.prepare('SELECT avatar FROM users WHERE username = ?');
    let avatar = sql.get(username).avatar;
    let sql1 = db.prepare('SELECT status FROM users WHERE username = ?');
    let status = sql1.get(username).status;

    res.render('other.hbs', {
        avatar: avatar,
        username: username,
        status: status
    });
});

app.get('/exit', urlencodedParser, (req, res) => {
    res.cookie('username', '');
    res.cookie('password', '');

    res.redirect('/')
});

app.get('/reico', urlencodedParser, (req, res) => {
    let username = req.cookies.username;
    let sql = db.prepare('SELECT avatar FROM users WHERE username = ?');
    let avatar = sql.get(username).avatar;

    res.render('reico.hbs', {
        avatar: avatar,
    });
});

app.get('/restatus', urlencodedParser, (req, res) => {
    let username = req.cookies.username;
    let sql = db.prepare('SELECT avatar FROM users WHERE username = ?');
    let avatar = sql.get(username).avatar;

    res.render('restatus.hbs', {
        avatar: avatar,
    });
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

app.get('/', urlencodedParser, (req, res) => {
    let username = req.cookies.username;
    let password = req.cookies.password;
    let passworddb;
    let messages;

    try {
        let sql3 = db.prepare('SELECT * FROM messages ORDER BY id DESC');
        messages = sql3.all();
    } catch(e) {
        console.log(e);
    }

    try {
        let sql1 = db.prepare('SELECT password FROM users WHERE username = ?');
        passworddb = sql1.get(username).password;
    } catch(e) {
        console.log(e)
    }

    if(String(password) == String(passworddb)) {
        let ico;

        try {
            let sql2 = db.prepare('SELECT avatar FROM users WHERE username = ?');
            ico = sql2.get(username).avatar;
        } catch(e) {
            console.log(e)
        }

        res.render('indexlogged.hbs', {
            avatar: ico,
            authorusername: username,
            messages: messages,
        });
    } else {
        res.render('index.hbs', {
            messages: messages
        });
        return;
    }
});

app.get('/log', (req, res) => {
    res.render('login.hbs');
});

app.post('/commdelete', urlencodedParser, (req, res) => {
    let username = req.cookies.username;
    let msgauthor = req.body.msgauthor;
    let id = Number(req.body.msgid);
    if(msgauthor == username) {
        try {
            let sql = db.prepare('DELETE FROM messages WHERE id = ?');
            sql.run(id);
        } catch(e) {
            console.log(e);
        }
    }
    res.redirect('/');
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

app.post('/send_message', urlencodedParser, (req, res) => {
    let username = req.cookies.username;
    let password = req.cookies.password;
    let content = req.body.message;
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
    let passworddb;
    let avatar;
    let authorid;
    try {
        let sql3 = db.prepare('SELECT id FROM users WHERE username = ?');
        authorid = sql3.get(username).id;
    } catch(e) {
        console.log(e)
    }
    try {
        let sql2 = db.prepare('SELECT password FROM users WHERE username = ?');
        passworddb = sql2.get(username).password;
    } catch(e) {
        console.log(e)
    }

    try {
        let sql2 = db.prepare('SELECT avatar FROM users WHERE username = ?');
        avatar = sql2.get(username).avatar;
    } catch(e) {
        console.log(e)
    }

    if(String(passworddb) == String(password)) {
        try {
            let sql = db.prepare('INSERT INTO messages (content, username, time, avatar, authorid) VALUES (?, ?, ?, ?, ?)');
            sql.run(content, username, time, avatar, authorid);
        } catch(e) {
            console.log(e);
            return;
        }
    }

    res.redirect('/');
});

app.post('/send_entry_message', urlencodedParser, (req, res) => {
    let themename = req.body.entryname;
    let username = req.cookies.username;
    let password = req.cookies.password;
    let entry = req.body.entrynames;
    let content = req.body.message;
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
    let passworddb;
    let avatar;
    try {
        let sql2 = db.prepare('SELECT password FROM users WHERE username = ?');
        passworddb = sql2.get(username).password;
    } catch(e) {
        console.log(e)
    }

    if(String(passworddb) == String(password)) {
        try {
            let sql2 = db.prepare('SELECT avatar FROM users WHERE username = ?');
            avatar = sql2.get(username).avatar;
        } catch(e) {
            console.log(e)
        }

        try {
            let sql = db.prepare('INSERT INTO ' + themename + ' (aname, aavatar, mcontent, time) VALUES (?, ?, ?, ?)');
            sql.run(username, avatar, content, time);
        } catch(e) {
            console.log(e);
            return;
        }
    }

    res.redirect(`/theme/spec/${themename}/next/${entry}`);
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

app.post('/restatus', urlencodedParser, (req, res) => {
    let username = req.cookies.username;
    let newstatus = String(req.body.newstat);
    try {
        let sql = db.prepare('UPDATE users SET status = ? WHERE username = ?');
        sql.run(newstatus, username);
    } catch(e) {
        console.log(e)
    }
    res.redirect('/profile');
});

app.get('/reg(.html)?', (req, res) => {
    res.sendFile(__dirname + '/registration.html');
});

console.log('listening');
console.log(process.env.PORT || 3000);
app.listen(process.env.PORT || 3000);