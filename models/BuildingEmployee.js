const mongoose = require('mongoose');

const buildingEmployeeSchema = new mongoose.Schema({
    employee_code: String,
    full_name: String,
    birthdate: Date,
    address: String,
    phone: String,
    level: Number,
    position: String,
    services_supervised: [{ type: mongoose.Schema.Types.ObjectId, ref: 'BuildingService' }],
    salary_rate: Number,
});

module.exports = mongoose.model('BuildingEmployee', buildingEmployeeSchema);
