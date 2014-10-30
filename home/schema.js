'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var HomeSchema = new Schema({
  price: String,
  address: String
});

module.exports = mongoose.model('Home', HomeSchema);