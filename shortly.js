var express = require('express');
var util = require('./lib/utility');
var partials = require('express-partials');
var bcrypt = require('bcrypt-nodejs');
var db = require('./app/config');
var Users = require('./app/collections/users');
var User = require('./app/models/user');
var Links = require('./app/collections/links');
var Link = require('./app/models/link');
var Click = require('./app/models/click');

var app = express();

app.configure(function() {
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.use(partials());
  app.use(express.bodyParser());
  app.use(express.cookieParser('shhhh, very secret'));
  app.use(express.session());
  app.use(express.static(__dirname + '/public'));
});

function restrict(req, res, next) {
  if (req.session.username) {
    next();
  } else {
    req.session.error = 'Access denied!';
    res.redirect('/login');
  }
}

app.get('/', function(req, res) {
  res.render('index');
});

app.get('/create', function(req, res) {
  res.render('index');
});

app.get('/links', function(req, res) {
  Links.reset().fetch().then(function(links) {
    res.send(200, links.models);
  })
});
app.get('/users', function(req, res){
  Users.reset().fetch().then( function ( users ){
    res.send(200, users.models);
  })
});


app.post('/links', function(req, res) {
  var uri = req.body.url;

  if (!util.isValidUrl(uri)) {
    console.log('Not a valid url: ', uri);
    return res.send(404);
  }

  new Link({ url: uri }).fetch().then(function(found) {
    if (found) {
      res.send(200, found.attributes);
    } else {
      util.getUrlTitle(uri, function(err, title) {
        if (err) {
          console.log('Error reading URL heading: ', err);
          return res.send(404);
        }

        var link = new Link({
          url: uri,
          title: title,
          base_url: req.headers.origin
        });

        link.save().then(function(newLink) {
          Links.add(newLink);
          res.send(200, newLink);
        });
      });
    }
  });
});

/************************************************************/
// Write your authentication routes here
/************************************************************/

// render the login view
app.get('/login', function(req, res){
  res.render('login');
});

// Verify login credentials,
  //if verified set session properties
  // else redirect to login
app.post('/login', function(req, res){
  // Creat user variables
  var username = req.body.username;
  var password = req.body.password;

  new User({username: username, password: password}).fetch().then(function ( found ){
    if(found){

      //regenerate the sessions
      // set the new session username
      // set the users session paramater
      console.log("found ", found);
    } else {
      res.redirect('/login');
      console.log("Authentication failed");
    }
  });
});


// render the signup view
app.get('/signup', function(req, res){
  res.render('signup');
});

// create a new user instance
  // verify that the user does not alread exist
  // if the user does exist
      // redirect to '/login'
  // else if the user does not exist
      // create a new User and pass the variables in
      // add the new user to the User collection
      // log the user in, setting the session
app.post('/signup', function(req, res){
  new User({username: username, password: password}).fetch().then(function ( found ){
    if(found){
      console.log("User already Created")
      res.redirect('/login');
    } else {

      // Hash Password
        //var salt = bcrypt.genSaltSync(10);
        //var hash = bcrypt.hashSync(password, salt);
      // create a new instance of the user
        // var user = new User({username: username, password: hash});
      // then add the new user to the collection of users;
        // Users.add(user);

      // redirect to '/'

    }
  });
});


/************************************************************/
// Handle the wildcard route last - if all other routes fail
// assume the route is a short code and try and handle it here.
// If the short-code doesn't exist, send the user to '/'
/************************************************************/

app.get('/*', function(req, res) {
  new Link({ code: req.params[0] }).fetch().then(function(link) {
    if (!link) {
      res.redirect('/');
    } else {
      var click = new Click({
        link_id: link.get('id')
      });

      click.save().then(function() {
        db.knex('urls')
          .where('code', '=', link.get('code'))
          .update({
            visits: link.get('visits') + 1,
          }).then(function() {
            return res.redirect(link.get('url'));
          });
      });
    }
  });
});

app.get('/restricted', restrict, function(request, response){
  response.send('This is the restricted area! Hello ' + request.session.username + '! click <a href="/logout">here to logout</a>');
});


console.log('Shortly is listening on 4568');
app.listen(4568);





  // var userObj = db.users.findOne({ username: username, password: hash });
  // var userObj = Users
  // console.log(userObj);
  // if(userObj){
  //   req.session.regenerate(function(){
  //     req.session.username = userObj.username;
  //     res.redirect('/restricted');
  //   });
  // } else {
  //   res.redirect('login');
  // }