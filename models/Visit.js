const mongoose = require('mongoose');

const geolocationSchema = new mongoose.Schema({
  country: { type: String, default: null },
  city: { type: String, default: null },
  region: { type: String, default: null },
  latitude: { type: Number, default: null },
  longitude: { type: Number, default: null },
  timezone: { type: String, default: null },
  isp: { type: String, default: null }
});

const visitSchema = new mongoose.Schema({
  ip: {
    type: String,
    required: true,
    index: true
  },
  sessionId: {
    type: String,
    required: true,
    index: true
  },
  visitTime: {
    type: Date,
    required: true,
    default: Date.now
  },
  geolocation: {
    type: geolocationSchema,
    default: {}
  }
}, {
  timestamps: true
});

// Индексы для эффективных запросов
visitSchema.index({ ip: 1, visitTime: -1 });
visitSchema.index({ sessionId: 1, visitTime: -1 });
visitSchema.index({ visitTime: -1 });

module.exports = mongoose.model('Visit', visitSchema);