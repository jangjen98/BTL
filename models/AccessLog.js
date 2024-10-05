const mongoose = require('mongoose');

const accessLogSchema = new mongoose.Schema({
    employee_id: { type: mongoose.Schema.Types.ObjectId, ref: 'BuildingEmployee' },
    entry_time: Date,
    exit_time: Date,
    location: String,
});

module.exports = mongoose.model('AccessLog', accessLogSchema);
