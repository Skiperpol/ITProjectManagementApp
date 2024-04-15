const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const statusEnums = require('../utils/enums/status')
const priorityEnums = require('../utils/enums/priority')

const ProjectCredentialsSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    developers: {
        type: [Schema.Types.ObjectId],
        ref: 'Developer',
        default: []
    }
});

const ProjectSchema = new Schema({
    developerID: {
        type: String,
        required: true
    },
    projectCredentials: {
        type: ProjectCredentialsSchema,
        required: true
    },
    description: { 
        type: String, 
        required: false 
    },
    status: { 
        type: String, 
        required: true, 
        enum: statusEnums
    },
    priority: { 
        type: String, 
        required: true, 
        enum: priorityEnums
    },
});

const ProjectModel = mongoose.model('Project', ProjectSchema);

module.exports = ProjectModel;