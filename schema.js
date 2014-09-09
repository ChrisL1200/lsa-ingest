'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var SchoolSchema = new Schema({
  mx_id: String,
  nces_disid: String,
  nces_schid: String,
  sch_name: String,
  ed_level: String,
  color: String,
  relver: String,
  score: Number,
  coordinates: {
    latitude: Number,
    longitude: Number
  },
  wkt: [{
  	latitude: Number,
  	longitude: Number
  }]
});

module.exports = mongoose.model('School', SchoolSchema);