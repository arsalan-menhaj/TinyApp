var express = require("express");
var app = express();
var PORT = process.env.PORT || 8080; // default port 8080

const cParser = require("cookie-parser");
app.use(cParser());

const bodyParser = require("body-parser");

app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");


var urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

app.get("/", (req, res) => {
  res.end("Hello!");
});

app.get("/urls", (req, res) => {
  let templateVars = {
    urls: urlDatabase,
    username: req.cookies["username"]
  }
  console.log(req.cookies)
  res.render("urls_index", templateVars);
})

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/urls/new", (req, res) => {
  let templateVars = {
    username: req.cookies["username"]
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
      username: req.cookies["username"]
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
  var shortURL = generateRandomString();
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

app.post("/login", (req, res) => {
  res.cookie('username',req.body.username);
  console.log(req.body.username);
  res.redirect("/urls");
  res.status(302);
});

app.post("/logout", (req, res) => {
  res.clearCookie('username');
  res.redirect("/urls");
  res.status(302);
});

app.listen(PORT, () => {
  console.log(`TinyApp listening on port ${PORT}!`);
});

function generateRandomString() {
  var text = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (var i = 0; i < 7; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}


