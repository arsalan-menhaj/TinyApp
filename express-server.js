const express = require("express");
const app = express();
const PORT = process.env.PORT || 8080; // default port 8080

const cParser = require("cookie-parser");
const cSession = require("cookie-session");
const methodOverride = require('method-override')



app.use(cParser());
app.use(cSession({
  name: 'session',
  keys: ['key1', 'key2']
}))
app.use(methodOverride('_method'));


const bodyParser = require("body-parser");

app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");

const bcrypt = require('bcrypt');


const urlDatabase = {
  "b2xVn2": {
    "userid": "userRandomID",
    "longURL": "http://www.lighthouselabs.ca",
    "timesVisited": 0,
    "visitors&Times": {},
    "numberOfUniques": 0
  },
  "9sm5xK": {
    "userid": "user2RandomID",
    "longURL": "http://www.google.com",
    "timesVisited": 0,
    "visitors&Times": {},
    "numberOfUniques": 0
  }
};

const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    hashedPassword: '$2a$10$ESUkQ3Txnqtk3dNcaFfs0eHlyiG5Kk3HvH7rgETCBeUFOAC9sKsJe',
  },
 "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    hashedPassword: '$2a$10$xbzvUSoZNlQ5/N0tXpegMebVIVC5V/A.lC0rP.ro5.AFX9tV1jhW.',
  }
}

// Creates list of user emails currently in database
function getUserEmails() {
  const userEmails = [];
  for (let user in users) {
    userEmails.push(users[user].email);
  }
  return userEmails;
}

// Checks user email array to verify whether a given email address is already registered
function checkUserEmail (givenEmail) {
  const allEmails = getUserEmails();
  for (let email of allEmails) {
    if (email === givenEmail) {
      return true;
    }
  }
  return false;
}

// Locates a user based on a given email
function locateUser (givenEmail) {
  for (let user in users) {
    if (users[user].email === givenEmail) {
      return users[user].id;
    }
  }
  return undefined;
}

// Helper function to update analytics information upon every visit to a shortURL
// Will be invoked every time a user navigates to a site using a shortURL
function updateAnalytics(shortURL,visitorID) {
  let timestamp = new Date().toString();
  urlDatabase[shortURL]["timesVisited"]++;

  // Increments the number of unique visitors upon new visitor
  // and creates new array to contain timestamps for said visitor
  if (!urlDatabase[shortURL]["visitors&Times"][visitorID]) {
    urlDatabase[shortURL]["numberOfUniques"]++;
    urlDatabase[shortURL]["visitors&Times"][visitorID] = [];
  }

  urlDatabase[shortURL]["visitors&Times"][visitorID].push(timestamp);
  console.log(urlDatabase);
}

// Helper function to display analytics information.
// Will be invoked on URL edit page
function displayAnalytics(shortURL) {
  analyticsInfo = {
    "timesVisited": urlDatabase[shortURL]["timesVisited"],
    "numberOfUniques": urlDatabase[shortURL]["numberOfUniques"],
    "visitors&Times": urlDatabase[shortURL]["visitors&Times"]
  };
  return analyticsInfo;
}



app.get("/", (req, res) => {
  res.end("Hello!");
});

// Route for main page
app.get("/urls", (req, res) => {
  let templateVars = {
    urls: urlDatabase,
    user_id: req.session["user_id"]
  }
  res.render("urls_index", templateVars);
})

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});


// Route leading to page where user can create a new shortURL
app.get("/urls/new", (req, res) => {
  if (!req.session["user_id"]) {
    res.status(403);
    res.end("403: You do not have permission to access this page.");
  } else {
    let templateVars = {
      user_id: req.session["user_id"]
    };
    res.render("urls_new",templateVars);
  }
});

// Route leading to page displaying information about a particular shortURL
app.get("/urls/:id", (req, res) => {
  let urlUser = urlDatabase[req.params.id].userid;

  if (!urlDatabase[req.params.id]) {
    // Returns 404 error if given shortURL does not exist
    res.status(404);
    res.end("404: Page not found.");
  } else if (!req.session["user_id"] || req.session["user_id"] !== urlUser) {
    // Return 403 error if the user is not logged in as the user that the shortURL belongs to
    res.status(403);
    res.end("403: You do not have permission to access this page.");
  }


  let templateVars = {
    "shortURL": req.params.id,
    "original": urlDatabase[req.params.id].longURL,
    "user_id": req.session["user_id"],
    "analytics": displayAnalytics(req.params.id)
  };

  console.log(JSON.stringify(templateVars.analytics["visitors&Times"]));
  res.render("urls_show", templateVars);

});


// Route for deleting a particular shortURL. Redirects user to main page
app.delete("/urls/:id/delete", (req, res) => {
  let urlUser = urlDatabase[req.params.id].userid;
  if (!req.session["user_id"] || req.session["user_id"] !== urlUser) {
    res.status(403);
    res.end("403: You do not have permission to perform this action.");
  } else {
    delete urlDatabase[req.params.id];
    res.redirect("/urls");
  }
});

// Route for changing the longURL associated with a shortURL. Redirects user to main page
app.put("/urls/:id/update", (req, res) => {
  let urlUser = urlDatabase[req.params.id].userid;
  if (!req.session["user_id"] || req.session["user_id"] !== urlUser) {
    res.status(403);
    res.end("403: You do not have permission to perform this action.");
  } else {
    newURL = req.body.longURL;
    urlDatabase[req.params.id].longURL = req.body.longURL;
    res.redirect("/urls");
  }
});

// Route for generating a new shortURL. Redirects to the newly created shortURL page
app.post("/urls", (req, res) => {

  // Randomly generated string acts as new shortURL
  let shortURL = generateRandomString(7);

  // Creates entry in urlDatabase for new shortURL
  urlDatabase[shortURL] = {};
  urlDatabase[shortURL]["userid"] = req.session["user_id"];
  urlDatabase[shortURL]["longURL"] = req.body.longURL;
  urlDatabase[shortURL]["timesVisited"] = 0;
  urlDatabase[shortURL]["visitors&Times"] = {};
  urlDatabase[shortURL]["numberOfUniques"] =  0;
  res.redirect(`/urls/${shortURL}`);
  res.status(302);
});


// When shortURL is included in URL, redirects user to corresponding longURL
// and updates analytics information
app.get("/u/:shortURL", (req, res) => {
  let destination = urlDatabase[req.params.shortURL].longURL;
  res.redirect(destination);
  res.status(302);
  updateAnalytics(req.params.shortURL, req.session["user_id"] ? req.session["user_id"] : "anonymous");
  console.log(req.params.shortURL);
  console.log(req.session["user_id"] ? req.session["user_id"] : "anonymous");
});

app.get("/hello", (req, res) => {
  res.end("<html><body>Hello <b>World</b></body></html>\n");
});

// Login page route
app.get("/login", (req, res) => {
  let templateVars = {
    user_id: users[req.session["user_id"]]
  };
  res.render("login",templateVars);
});

// Login authentication route
app.post("/login", (req, res) => {
  let givenEmail = req.body.email;
  let givenUser = locateUser(givenEmail);

  if ( givenUser && bcrypt.compareSync(req.body.password, users[givenUser].hashedPassword) ) {
    req.session.user_id = users[givenUser].id;
    res.redirect("/urls");
    res.status(302);
  } else {
    res.status(400);
    res.end("400: That User ID or password is invalid.");
  }

});

// Logout route
app.post("/logout", (req, res) => {
  res.clearCookie("session");
  res.clearCookie("session.sig");
  res.redirect("/urls");
  res.status(302);
});

// Registration page route
app.get("/register", (req, res) => {
  res.render("register");
})

// Registration information submission route
app.post("/register", (req, res) => {
  let newUserID = generateRandomString(12);
  users[newUserID] = {};

  // Hashes user password
  const hashedPassword = bcrypt.hashSync(req.body.password, 10);

  if ( !req.body.email || !hashedPassword || checkUserEmail(req.body.email) ) {
    res.status(400);
    res.end("400: Bad Request \n Please enter a valid email/password that is not already registered");
  } else {
    // Generates new user entry in users database
    users[newUserID]["id"] = newUserID;
    users[newUserID]["email"] = req.body.email;
    users[newUserID]["hashedPassword"] = hashedPassword;
    req.session.user_id = newUserID;
    res.redirect('/urls');
  }
});

// Message to indicate successful server startup
app.listen(PORT, () => {
  console.log(`TinyApp listening on port ${PORT}!`);
});


function generateRandomString(length) {
  let text = "";
  let possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (let i = 0; i < length ; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}
