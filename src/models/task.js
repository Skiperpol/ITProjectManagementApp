const specializationsEnums = require('../utils/enums/specializations')
const stateEnums = require("../utils/enums/state")
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const TaskCredentialsSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    assignedTo: {
        type: Schema.Types.ObjectId,
        ref: 'Developer',
        default: null
    },
    estimation: {
        type: Number,
        required: true
    },
    specialization: {
        type: String,
        required: true,
        enum: specializationsEnums
    }
});

const TaskSchema = new Schema({
    projectId: {
        type: Schema.Types.ObjectId,
        ref: 'Project',
        required: true
    },
    credentials: {
        type: TaskCredentialsSchema,
        required: true
    },
    state: {
        type: String,
        required: true,
        enum: stateEnums
    },
    createdAt: {
        type: Date,
        default: Date.now,
        immutable: true
    },
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'Developer',
        required: true
    },
    dateRange: {
        type: {
            startDate: Date,
            endDate: Date
        },
        default: null
    },
    executionTime: {
        type: Number,
        default: null
    }
});

const TaskModel = mongoose.model('Task', TaskSchema);

module.exports = {
    TaskModel,
    TaskSchema
};