const mongoose = require('mongoose');

const companyEmployeeSchema = new mongoose.Schema({
    company_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
    employee_code: String,
    identity_card: String,
    full_name: String,
    birthdate: Date,
    phone: String,
});

module.exports = mongoose.model('CompanyEmployee', companyEmployeeSchema);
