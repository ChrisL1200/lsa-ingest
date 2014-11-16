'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var ScoreSchema = new Schema({
  mx_id: String,
  nces_disid: String,
  nces_schid: String,
  sch_name: String,
  ed_level: String,
  score: Number,
  phone: String,
  color: String,
  relver: String,
  freeLunch: Number,
  redLunch: Number,
  member: Number,
  title: String,
  coordinates: {
    latitude: Number,
    longitude: Number
  },
  wkt: [{
  	latitude: Number,
  	longitude: Number
  }]
});

module.exports = mongoose.model('Score', ScoreSchema);