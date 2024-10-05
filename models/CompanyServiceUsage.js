const mongoose = require('mongoose');

const companyServiceUsageSchema = new mongoose.Schema({
    company_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
    service_id: { type: mongoose.Schema.Types.ObjectId, ref: 'BuildingService' },
    start_date: Date,
    unit_price: Number,
    total_amount: Number,
    usage_days: Number,
    total_days_in_month: Number,
});

module.exports = mongoose.model('CompanyServiceUsage', companyServiceUsageSchema);
