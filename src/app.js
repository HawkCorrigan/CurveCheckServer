const mongoose = require('mongoose')
mongoose.connect('mongodb://localhost:27017/posts');
const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error"));
db.once("open", function(callback){
	console.log("Connection succeeded");
});


const express = require('express')
const passport = require('passport')
const util = require('util')
const cookieParser = require('cookie-parser');
const session = require('express-session');

const BnetStrategy = require('passport-bnet').Strategy;

const bodyParser = require('body-parser')
const cors = require('cors')
const axios = require('axios')
require('dotenv').config();
const BNET_ID = process.env.BNET_ID;
const BNET_SECRET = process.env.BNET_SECRET;

const Player = require('../models/player')



passport.serializeUser(function(user, done) {
    done(null, user);
});

passport.deserializeUser(function(obj, done) {
    done(null, obj);
});

passport.use(
  new BnetStrategy(
    { clientID: BNET_ID,
      clientSecret: BNET_SECRET,
      region: "eu",
      callbackURL: "http://localhost:8081/auth/bnet/callback" },
    function(accessToken, refreshToken, profile, done) {
      return done(null, profile);
    })
);

const app = express()

app.use(cookieParser())
app.use(session({
  secret: 'blizzard',
  saveUninitialized: true,
  resave: true}))

app.use(passport.initialize())
app.use(passport.session())

app.get('/auth/bnet',
        passport.authenticate('bnet'));

app.get('/auth/bnet/callback',
        passport.authenticate('bnet', { failureRedirect: '/' }),
        function(req, res){
          res.redirect('/debug');
        });

app.get('/', function(req, res) {
	if(req.isAuthenticated()) {

    var output = '<h1>Express OAuth Test</h1>' + req.user.id + '<br>';
    if(req.user.battletag) {
      output += req.user.battletag + '<br>';
    }
    output += '<a href="/logout">Logout</a>';
    res.send(output);
  } else {
    res.send('<h1>Express OAuth Test</h1>' +
             '<a href="/auth/github">Login with Github</a><br>' +
             '<a href="/auth/bnet">Login with Bnet</a>');
  }
});


app.get('/curve/:name/:realm', (req, res) => {
        if(req.isAuthenticated()) {
		const url = `https://eu.api.blizzard.com/profile/wow/character/${req.params.realm}/${req.params.name}/achievements?namespace=profile-eu`;
		axios.get(url, {headers: {'Authorization': 'Bearer '+req.user.token}})
		.then(function(response){
			const achievements=response.data.achievements;
			const curve = achievements.find(element => element.id === 14068);
			res.send(curve.criteria.is_completed);
		});
	} else {
	        res.redirect('/auth/bnet');
	}
})

app.get('/test', (req, res) => {
        if(req.isAuthenticated()) {
		const url = `https://eu.api.blizzard.com/data/wow/playable-specialization/index?namespace=static-eu`;
		console.log(req.user.token);
		axios.get(url, {headers: {'Authorization': 'Bearer '+req.user.token}})
		.then(function(response){
		//	const achievements=response.data.achievements;
		//	const curve = achievements.find(element => element.id === 14068);
			console.log(response);
			res.send(response.data);
		});
	} else {
		console.log("KAPUTT");
	        res.redirect('/auth/bnet');
	}
})

app.post('/players', (req, res) => {
	var db = req.db;
	var characterName = req.body.characterName;
	var characterRealm = req.body.characterRealm;
	var newPlayer = new Player({
		characterName,
		characterRealm
	})

	newPlayer.save(function(error){
		if(error){
			console.log(error)
		}
		req.send({
			success: true,
			message: 'Player saved successfully'
		})
	})
})

app.delete('/players', (req, res) => {
	var db = req.db;
	Player.remove({
		_id: req.params.id
	}, function(err, player) {
		if (err)
			res.send(err)
		res.send({
			success: true
		})
	})
})

app.listen(process.env.PORT || 8081)


