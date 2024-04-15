const Project = require('../models/project')
const Task = require('../models/task').TaskModel
const Developer = require('../models/developer')

async function getUnassignedTasksBySpecialization(projectId) {
    try {
        const tasks = await Task.find({ projectId: projectId, "credentials.assignedTo": null, state: "OPEN" });
        const tasksBySpecialization = tasks.reduce((acc, task) => {
            if (!acc[task.credentials.specialization]) {
                acc[task.credentials.specialization] = [];
            }
            acc[task.credentials.specialization].push(task);
            return acc;
        }, {});

        for (const specialization in tasksBySpecialization) {
            tasksBySpecialization[specialization].sort((a, b) => b.credentials.estimation - a.credentials.estimation);
        }

        return tasksBySpecialization;
    } catch (error) {
        console.error('Error fetching unassigned tasks:', error);
        throw error;
    }
}

async function getDevelopersBySpecialization(projectId) {
    try {
        const developers = await Developer.find({ projectId: projectId });
        const developersBySpecialization = developers.reduce((acc, developer) => {
            if (!acc[developer.specialization]) {
                acc[developer.specialization] = [];
            }
            acc[developer.specialization].push(developer);
            return acc;
        }, {});
        return developersBySpecialization;
    } catch (error) {
        console.error('Error fetching developers:', error);
        throw error;
    }
}

async function getAverageExecutionTimeForEstimation(developerId, estimation) {
    try {
        const developer = await Developer.findById(developerId);
        const stat = developer.estimationStats.find(stat => stat.estimation === Number(estimation));
        if (!stat) {
            return 0;
        }
        
        return stat.averageTime;
    } catch (error) {
        console.error('Error fetching average execution time:', error);
        throw error;
    }
}

async function sortDevelopersByTaskExecutionTime(developers, taskId) {
    const times = await Promise.all(developers.map(async developer => {
        const averageTime = await getAverageExecutionTimeForEstimation(developer._id, taskId.credentials.estimation);
        return { developerId: developer._id, averageTime };
    }));

    const timeMap = times.reduce((map, item) => {
        map[item.developerId] = item.averageTime;
        return map;
    }, {});

    developers.sort((a, b) => timeMap[b._id] - timeMap[a._id]);
    return developers;
}

async function algorithmTaskAssignment(projectId) {
    try {
        const tasksBySpecialization = await getUnassignedTasksBySpecialization(projectId);
        const developersBySpecialization = await getDevelopersBySpecialization(projectId);
        const assignmentResults = {};

        for (const specialization in tasksBySpecialization) {
            const tasks = tasksBySpecialization[specialization];
            let developers = developersBySpecialization[specialization] || [];
            const developersLength = developers.length;
            let currentEstimation = 0;
            let actualDevelopers = developers
            for (const task of tasks) {
                if (!actualDevelopers.length) break;

                actualDevelopers = await sortDevelopersByTaskExecutionTime(actualDevelopers, task)
                let fastestDeveloper = actualDevelopers[0];

                if (!assignmentResults[fastestDeveloper._id]) {
                    assignmentResults[fastestDeveloper._id] = { tasks: [] };
                }
                assignmentResults[fastestDeveloper._id].tasks.push(task);
                currentEstimation += task.credentials.estimation;

                const newAverage = currentEstimation / developersLength;

                actualDevelopers = developers.filter(dev => {
                    const devEstimation = assignmentResults[dev._id] ? assignmentResults[dev._id].tasks.reduce((sum, t) => sum + t.credentials.estimation, 0) : 0;
                    return devEstimation < newAverage;
                });
            }
        }
        return assignmentResults;
    } catch (error) {
        console.error('Error in task assignment:', error);
        throw error;
    }
}

module.exports = {
    algorithmTaskAssignment
}