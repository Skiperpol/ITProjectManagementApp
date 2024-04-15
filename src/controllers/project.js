const Project = require('../models/project')
const Task = require('../models/task').TaskModel
const Developer = require('../models/developer')
const mongoose = require('mongoose');
const TaskAssignmentsModel = require('../models/taskAssignment')
const { algorithmTaskAssignment } = require("../algorithms/taskAssignment")

const getProjects = ((req, res) => {
    Project.find({})
    .then(result => res.status(200).json({ result }))
    .catch(error => res.status(500).json({msg: error}))
});

const getProject = ((req, res) => {
    Project.findById(req.params.projectId)
    .then(result => res.status(200).json({ result }))
    .catch(error => res.status(500).json({ msg: "Internal Server Error: " + error.message }))
});

const getProjectTasks = ((req, res) => {
    Task.find({"projectId": req.params.projectId})
    .then(result => res.status(200).json({ result }))
    .catch(error => res.status(500).json({ msg: "Internal Server Error: " + error.message }))
});

const removeProject = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const projectId = req.params.projectId;

        await Project.findOneAndDelete({ _id: projectId }).session(session);
        const deletedTasksResult = await Task.deleteMany({ projectId: projectId }).session(session);
        const updatedDevelopersResult = await Developer.updateMany(
            { projectId: projectId },
            { $pull: { projectId: projectId } },
            { session }
        );

        await session.commitTransaction();
        session.endSession();

        res.status(200).json({
            msg: `Project and ${deletedTasksResult.deletedCount} tasks deleted successfully, ` +
                 `${updatedDevelopersResult.nModified} developers updated`
        });
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        res.status(500).json({ msg: "Internal Server Error: " + error.message });
    }
};

const removeProjects = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        await Task.deleteMany({}).session(session);
        await Project.deleteMany({}).session(session);
        await Developer.updateMany({},
            {
                $set: {
                    projectId: [],
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
        res.status(200).json({ msg: 'Projects and Tasks deleted successfully' });
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        res.status(500).json({ msg: "Internal Server Error: " + error.message });
    }
};

const createProject = async(req, res) => {
    try {
        const project = new Project(req.body);
        const savedProject = await project.save();
        res.status(201).json(savedProject);
    } catch (error) {
        res.status(500).json({ msg: "Internal Server Error: " + error.message });
    }
};

const updateProject = ((req, res) => {
    const { developerID, description, status, priority } = req.body;
    const credentials = {
        name: req.body['credentials.name'],
        developers: req.body['credentials.developers'],
    };
    Project.findOneAndUpdate(
        { _id: req.params.projectId },
        { $set: { 
            developerID,
            "credentials.name": credentials.name,
            "credentials.developers": credentials.developers,
            description,
            status,
            priority }},
        { new: true, runValidators: true }
    )
    .then(project => res.status(200).json({ msg: 'Project updated successfully', project }))
    .catch(error => res.status(500).json({ msg: "Internal Server Error: " + error.message }));
});

const transformAssignedTasksData = (assignedTasksData) => {
    const assignments = Object.entries(assignedTasksData).map(([developerId, details]) => {
        return {
            developerId: developerId,
            tasks: details.tasks
        };
    });

    return { assignments };
};

const createTaskAssignment = async (req, res) => {
    try {
        const projectId = req.params.projectId;
        const rawAssignedTasksData = await algorithmTaskAssignment(projectId);
        const assignedTasksData = transformAssignedTasksData(rawAssignedTasksData);
        await TaskAssignmentsModel.deleteMany({});
        let savedAssignments = [];
        for (const assignment of assignedTasksData.assignments) {
            const taskAssignment = new TaskAssignmentsModel({
                developerId: assignment.developerId,
                tasks: assignment.tasks
            });
            const savedAssignment = await taskAssignment.save();
            savedAssignments.push(savedAssignment);
        }
        res.json(savedAssignments);
    } catch (error) {
        console.error('Error in API:', error);
        res.status(500).send('Internal Server Error: ' + error.message);
    }
};

const getTaskAssignment = ((req, res) => {
    TaskAssignmentsModel.find({})
    .then(result => res.status(200).json({ result }))
    .catch(error => res.status(500).json({msg: error}))
})

const handleAssignment = async (req, res) => {
    try {
        const { action } = req.body;
        if (action === 'accept') {
            const taskAssignments = await TaskAssignmentsModel.find({});
            for (const assignment of taskAssignments) {
                const developerId = new mongoose.Types.ObjectId(assignment.developerId);
                for (const task of assignment.tasks) {
                    await Task.findByIdAndUpdate(
                        new mongoose.Types.ObjectId(task._id),
                        { $set: { 'credentials.assignedTo': developerId } },
                        { new: true, runValidators: true}
                    );
                }
            }
            await TaskAssignmentsModel.deleteMany({});
        } else if (action === 'delete') {
            await TaskAssignmentsModel.deleteMany({});
        } else {
            return res.status(400).send('Invalid action specified');
        }
        res.send('Operation completed successfully');
    } catch (error) {
        console.error('Error handling assignments:', error);
        res.status(500).send('Internal Server Error: ' + error.message);
    }
};

module.exports = {
    getProjects,
    getProject,
    getProjectTasks,
    createProject,
    updateProject,
    removeProject,
    removeProjects,
    createTaskAssignment,
    getTaskAssignment,
    handleAssignment
}