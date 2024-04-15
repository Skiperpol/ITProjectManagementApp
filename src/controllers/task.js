const Task = require('../models/task').TaskModel
const Developer = require('../models/developer')
const mongoose = require('mongoose');

const getTasks = ((req, res) => {
    Task.find({})
    .then(result => res.status(200).json({ result }))
    .catch(error => res.status(500).json({msg: error}))
})

const getTask = ((req, res) => {
    Task.findById(req.params.taskId)
    .then(result => res.status(200).json({ result }))
    .catch(error => res.status(500).json({ msg: "Internal Server Error: " + error.message }))
});

const removeTask = ((req, res) => {
    Task.findOneAndDelete({ _id: req.params.taskId })
    .then(res.status(200).json({ msg: 'Task deleted successfully' }))
    .catch(error => res.status(500).json({ msg: "Internal Server Error: " + error.message }));
});

const removeTasks = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        await Task.deleteMany({}).session(session);
        await Developer.updateMany({},
            {
                $set: {
                    estimationStats: [{
                        estimation: 0,
                        totalHours: 0,
                        taskCount: 0,
                        averageTime: 0
                    }]
                }
            },
            { session }
        );
        await session.commitTransaction();
        session.endSession();
        res.status(200).json({ msg: 'Tasks and Developer updated successfully' });
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        res.status(500).json({ msg: "Internal Server Error: " + error.message });
    }
}

const createTask = async(req, res) => {
    try {
        const task = new Task(req.body);
        const savedTask = await task.save();
        res.status(201).json(savedTask);
    } catch (error) {
        res.status(500).json({ msg: "Internal Server Error: " + error.message });
    }
};

const updateTask = ((req, res) => {
    const { projectId, state, createdAt, createdBy, dateRange, executionTime} = req.body;
    const credentials = {
        assignedTo: req.body['credentials.assignedTo'],
        name: req.body['credentials.name'],
        estimation: req.body['credentials.estimation'],
        specialization: req.body['credentials.specialization']
    };
    Task.findOneAndUpdate(
        { _id: req.params.taskId },
        { $set: { 
            projectId,
            "credentials.name": credentials.name,
            "credentials.assignedTo": credentials.assignedTo,
            "credentials.estimation": credentials.estimation,
            "credentials.specialization": credentials.specialization,
            state,
            createdAt,
            createdBy,
            dateRange,
            executionTime
        }},
        { new: true, runValidators: true }
        
    )
    .then(task => {res.status(200).json({ msg: 'Task updated successfully', task });})
    .catch(error => res.status(500).json({ msg: "Internal Server Error: " + error.message }));
});

const makeTaskClosed = async (req, res) => {
    const { executionTime } = req.body;
    const taskId = req.params.taskId;

    try {
        const task = await Task.findById(taskId);
        task.state = 'CLOSED';
        task.executionTime = executionTime;
        await task.save();

        const developer = await Developer.findById(task.credentials.assignedTo);
        let stats = developer.estimationStats.find(stat => stat.estimation === task.credentials.estimation);
        if (!stats) {
            stats = {
                estimation: task.credentials.estimation,
                totalHours: 0,
                taskCount: 0,
                averageTime: 0
            };
        }
        stats.totalHours += executionTime;
        stats.taskCount += 1;
        stats.averageTime = stats.totalHours / stats.taskCount;
        developer.estimationStats.push(stats);
        developer.markModified('estimationStats');
        await developer.save();

        res.status(200).json({ message: 'Task closed and developer updated successfully' });
    } catch (error) {
        console.log(error);
        res.status(500).json({ msg: "Internal Server Error: " + error.message });
    }
};

module.exports = {
    createTask,
    getTasks,
    getTask,
    removeTask,
    removeTasks,
    updateTask,
    makeTaskClosed
}