const Developer = require('../models/developer')
const Task = require('../models/task').TaskModel
const Project = require('../models/project')
const mongoose = require('mongoose');

const isDeveloper = ((req, res) => {
    res.status(200).json({
        status: "success",
        message: "Welcome to the your Dashboard!",
    });
});

const isAdmin = ((req, res) => {
    res.status(200).json({
        status: "success",
        message: "Welcome to the Admin portal!",
    });
});

const getDevelopers = ((req, res) => {
    Developer.find({})
    .then(result => res.status(200).json({ result }))
    .catch(error => res.status(500).json({ msg: "Internal Server Error: " + error.message }))
});

const getDeveloper = ((req, res) => {
    Developer.findById(req.params.userId)
    .then(result => res.status(200).json({ result }))
    .catch(error => res.status(500).json({ msg: "Internal Server Error: " + error.message }))
});

const getDevelopersBySpecialization = ((req, res) => {
    Developer.find({specialization: req.params.specialization})
    .then(result => res.status(200).json({ result }))
    .catch(error => res.status(500).json({ msg: "Internal Server Error: " + error.message }))
});

const getDeveloperTasksInProject = ((req, res) => {
    Task.find({
        "credentials.assignedTo": req.params.userId,
        "projectId": req.params.projectId
    })
    .then(result => res.status(200).json({ result }))
    .catch(error => res.status(500).json({ msg: "Internal Server Error: " + error.message }))
});

const getDeveloperProjects = ((req, res) => {
    Developer.findOne({ _id: req.params.userId })
    .populate('projectId')
    .exec()
    .then(user => {res.status(200).json(user.projectId)})
    .catch(error => res.status(500).json({msg: "Internal Server Error: " + error.message}))
});

const getDeveloperTasks = ((req, res) => {
    Task.find({"credentials.assignedTo": req.params.userId})
    .then(result => res.status(200).json({ result }))
    .catch(error => res.status(500).json({ msg: "Internal Server Error: " + error.message }))
});

const removeDevelopers = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        await Developer.deleteMany({}).session(session);
        await Task.deleteMany({}).session(session);
        await Project.deleteMany({}).session(session);
        await session.commitTransaction();
        session.endSession();
        res.status(200).json({ msg: 'Developers, Projects and Tasks deleted successfully' });
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        res.status(500).json({ msg: "Internal Server Error: " + error.message });
    }
};

const removeDeveloper = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const developerId = req.params.userId;

        await Developer.findOneAndDelete({ _id: developerId }).session(session);

        const projects = await Project.find({ developerID: developerId }).session(session);
        const projectIds = projects.map(proj => proj._id);
        await Task.deleteMany({ projectId: { $in: projectIds } }).session(session);
        await Project.deleteMany({ developerID: developerId }).session(session);
        await Task.updateMany(
            { projectId: { $nin: projectIds }, "credentials.assignedTo": developerId },
            { $set: { "credentials.assignedTo": null } },
            { session }
        );

        await session.commitTransaction();
        session.endSession();
        res.status(200).json({ msg: 'Developer and related projects and tasks deleted successfully' });
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        res.status(500).json({ msg: "Internal Server Error: " + error.message });
    }
};

const updateDeveloper = async (req, res) => {
    const { projectId, first_name, last_name, email, specialization, role } = req.body;
    try {
        const updatedDeveloper = await Developer.findOneAndUpdate(
            { _id: req.params.userId },
            { $set: { projectId, first_name, last_name, email, specialization, role } },
            { new: true, runValidators: true }
        );
        res.status(200).json({ msg: 'Developer updated successfully', developer: updatedDeveloper });
    } catch (error) {
        res.status(500).json({ msg: "Internal Server Error: " + error.message });
    }
};

const addProjectIDToDeveloper = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const developerId = req.params.userId;
        const projectId = req.params.projectId;

        const developer = await Developer.findById(developerId).session(session);
        const project = await Project.findById(projectId).session(session);

        developer.projectId.push(projectId);
        await developer.save({ session });

        project.projectCredentials.developers.push(developerId);
        await project.save({ session });

        await session.commitTransaction();
        res.status(200).json({ message: 'Developer added to Project successfully', updatedDeveloper: developer });
    } catch (error) {
        await session.abortTransaction();
        res.status(500).json({ message: "Internal Server Error: " + error.message });
    } finally {
        session.endSession();
    }
};

module.exports = {
    isDeveloper,
    isAdmin,
    getDeveloper,
    getDevelopers,
    getDevelopersBySpecialization,
    getDeveloperTasksInProject,
    getDeveloperTasks,
    removeDeveloper,
    removeDevelopers,
    updateDeveloper,
    addProjectIDToDeveloper,
    getDeveloperProjects
}