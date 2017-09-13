var express = require("express");
var app = express();
var PORT = process.env.PORT || 8080; // default port 8080

const cParser = require("cookie-parser");
app.use(cParser());

const bodyParser = require("body-parser");

app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");


const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
 "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
}

// Stores user emails in a seprate array
const userEmails = [];
for (let user in users) {
  userEmails.push(users[user].email);
}

// Checks user email array to verify whether a given email address is already registered
function checkUserEmail (givenEmail) {
  for (let email of userEmails) {
    if (email === givenEmail) {
      return true;
    }
    return false;
  }
}

function locateUser (givenEmail) {
  for (let user in users) {
    if (users[user].email === givenEmail) {
      return users[user].id;
    }
  }
  return undefined;
}

app.get("/", (req, res) => {
  res.end("Hello!");
});

app.get("/urls", (req, res) => {
  let templateVars = {
    urls: urlDatabase,
    user_id: req.cookies["user_id"]
  }
  console.log(req.cookies)
  res.render("urls_index", templateVars);
})

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/urls/new", (req, res) => {
  let templateVars = {
    user_id: req.cookies["user_id"]
  };
  res.render("urls_new",templateVars);
});

app.get("/urls/:id", (req, res) => {
  if (!urlDatabase[req.params.id]) { //Returns 404 error if given shortURL does not exist
    res.end("Page does not exist.");
    res.status(404);
  } else {
    let templateVars = {
      shortURL: req.params.id,
      original: urlDatabase[req.params.id],
      user_id: req.cookies["user_id"]
    };
    res.render("urls_show", templateVars);
  }
});

app.post("/urls/:id/delete", (req, res) => {
  delete urlDatabase[req.params.id];
  res.redirect("/urls");
});

app.post("/urls/:id/update", (req, res) => {
  console.log(req.body);
  newURL = req.body.longURL;
  urlDatabase[req.params.id] = req.body.longURL;
  res.redirect("/urls");
});

app.post("/urls", (req, res) => {
  console.log(req.body);
  var shortURL = generateRandomString(7);
  urlDatabase[shortURL] = req.body.longURL;  // debug statement to see POST parameters
  res.redirect(`/urls/${shortURL}`);
  res.status(302);
});

app.get("/u/:shortURL", (req, res) => {
  let longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
  res.status(302);
});

app.get("/hello", (req, res) => {
  res.end("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/login", (req, res) => {
  let templateVars = {
    user_id: users[req.cookies["user_id"]]
  };
  res.render("login",templateVars);
});

app.post("/login", (req, res) => {
  givenEmail = req.body.email;
  givenPassword = req.body.password;
  givenUser = locateUser(givenEmail);
  console.log(givenUser);

  if ( givenUser && users[givenUser].password === givenPassword) {
    res.cookie('user_id',users[givenUser].id);
    console.log(givenUser);
    res.redirect("/urls");
    res.status(302);
  } else {
    res.status(400);
    res.end("400: That User ID or password is invalid.");
  }

});

app.post("/logout", (req, res) => {
  res.clearCookie('user_id');
  res.redirect("/urls");
  res.status(302);
});

app.get("/register", (req, res) => {
  res.render("register");
})

app.post("/register", (req, res) => {
  let newUserID = generateRandomString(12);
  users[newUserID] = {};
  console.log(req.body);

  if ( !req.body.email || !req.body.password || checkUserEmail(req.body.email) ) {
    res.status(400);
    res.end("400: Bad Request \n Please enter a valid email/password that is not already registered");
  } else {
    users[newUserID]["id"] = newUserID;
    users[newUserID]["email"] = req.body.email;
    users[newUserID]["password"] = req.body.password;
    res.cookie('user_id',newUserID);
    res.redirect('/urls');
    console.log(users);
  }
});

app.listen(PORT, () => {
  console.log(`TinyApp listening on port ${PORT}!`);
});

function generateRandomString(length) {
  var text = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (var i = 0; i < length ; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}


console.log(userEmails);
