'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var SchoolSchema = new Schema({
  mx_id: String,
  nces_disid: String,
  nces_schid: String,
  sch_name: String,
  ed_level: String,
  phone: String,
  color: String,
  freeLunch: Number,
  redLunch: Number,
  member: Number,
  income: Number,
  titleOne: String,
  stRatio: Number,
  score: {
    realEstate: Number,
    school: Number,
    overall: Number
  },
  relver: String,
  allReading: String,
  medianListing: Number,
  allMath: String,
  coordinates: {
    latitude: Number,
    longitude: Number
  },
  wkt: [{
    latitude: Number,
    longitude: Number
  }],
  address: {
    street: String,
    state: String,
    city: String,
    zip: String
  }
});

SchoolSchema.index({ 'coordinates.latitude': 1, 'coordinates.longitude': 1 });
SchoolSchema.index({ 'address.state': 1, 'address.city': 1 });
module.exports = mongoose.model('School', SchoolSchema);