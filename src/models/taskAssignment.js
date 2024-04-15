const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const TaskSchema = require('./task').TaskSchema

const TaskAssignmentsSchema = new Schema({
    developerId: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'Developer'
    },
    tasks: [TaskSchema]
});

const TaskAssignmentsModel = mongoose.model('TaskAssignment', TaskAssignmentsSchema);
module.exports = TaskAssignmentsModel
