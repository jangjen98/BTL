const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
    company_name: String,
    tax_code: String,
    capital: Number,
    business_field: String,
    employees_count: Number,
    office_address: {
        floor: Number,
        room_number: String,
    },
    phone: String,
    rental_area: Number,
    services: [{
        service_id: { type: mongoose.Schema.Types.ObjectId, ref: 'BuildingService' },
        start_date: Date,
        unit_price: Number,
    }],
});

module.exports = mongoose.model('Company', companySchema);
