const mongoose = require('mongoose');

const buildingServiceSchema = new mongoose.Schema({
    service_code: String,
    service_name: String,
    service_type: String,
    base_price: Number,
    price_increase_rate: Number,
});

module.exports = mongoose.model('BuildingService', buildingServiceSchema);
