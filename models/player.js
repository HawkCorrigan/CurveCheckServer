var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var PlayerSchema = new Schema({
	characterName: String,
	characterRealm: String
}, {timestamps: true});

mongoose.model('Player', PlayerSchema);
module.exports = PlayerSchema;
