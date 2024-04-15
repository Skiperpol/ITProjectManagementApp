const mongoose = require('mongoose');
const User = require('../models/developer.js');
const Project = require('../models/project.js');
const Task = require('../models/task.js').TaskModel;
const { param, body } = require('express-validator');
const specializationsEnum = require('../utils/enums/specializations.js')
const statusEnum = require('../utils/enums/status.js')
const stateEnum = require('../utils/enums/state.js')
const priorityEnum = require('../utils/enums/priority.js')

const validationUser = [
    param("userId")
        .not().isEmpty().withMessage("Enter userId")
        .bail()
        .trim()
        .custom(userId => {
            if (!mongoose.Types.ObjectId.isValid(userId)) {
                throw new Error('Invalid userId format');
            }
            return true;
        })
        .bail()
        .custom(async (userId) => {
            const user = await User.findById(userId);
            if (!user) {
                throw new Error('User not found');
            }
            return true;
        })
];

const validationProject = [
    param("projectId")
        .not().isEmpty().withMessage("Enter projectId")
        .bail()
        .trim()
        .custom(projectId => {
            if (!mongoose.Types.ObjectId.isValid(projectId)) {
                throw new Error('Invalid projectId format');
            }
            return true;
        })
        .bail()
        .custom(async (projectId) => {
            const project = await Project.findById(projectId);
            if (!project) {
                throw new Error('Project not found');
            }
            return true;
        })
];

const validationTask = [
    param("taskId")
        .not().isEmpty().withMessage("Enter taskId")
        .bail()
        .trim()
        .custom(taskId => {
            if (!mongoose.Types.ObjectId.isValid(taskId)) {
                throw new Error('Invalid taskId format');
            }
            return true;
        })
        .bail()
        .custom(async (taskId) => {
            const task = await Task.findById(taskId);
            if (!task) {
                throw new Error('Task not found');
            }
            return true;
        })
];

const validationSpecialization = [
    param("specialization").toUpperCase()
        .not().isEmpty().withMessage("Enter specialization")
        .bail()
        .trim()
        .custom(async value => {
            if (!Object.values(specializationsEnum).includes(value)) {
                throw new Error("Invalid specialization");
            }
            return true;
        })
];

const validationUpdateDeveloper = [
    body('projectId')
    .optional().isArray().withMessage('ProjectId must be an array of MongoDB ObjectIds')
    .custom(async (projectId) => {
        const project = await Project.findById(projectId);
        if (!project) {
            throw new Error('Project not found');
        }
        return true;
    }),
    body('first_name').optional().notEmpty().withMessage('First name is required').isLength({ max: 25 }).withMessage('First name cannot exceed 25 characters'),
    body('last_name').optional().notEmpty().withMessage('Last name is required').isLength({ max: 25 }).withMessage('Last name cannot exceed 25 characters'),
    body('email').optional().isEmail().withMessage('Invalid email format').normalizeEmail(),
    body('specialization').optional().notEmpty().withMessage('Specialization is required').isIn(specializationsEnum).withMessage('Invalid specialization'),
    body('role').optional().notEmpty().withMessage('Role is required'),
    body('role').optional().isIn(['admin', 'developer']).withMessage('Role must be either "admin" or "developer"'),
    body('estimationStats').optional().isEmpty().withMessage('Updating estimationStats is not allowed')
];

const validationHandleAssignment = [
    body('action').notEmpty().withMessage('Action is required').isIn(['accept', 'delete']).withMessage('Action must be either "accept" or "delete"')
]

const validationCreateProject = [
    body('developerID')
    .notEmpty().withMessage('DeveloperID is required')
    .isString().withMessage('Developer ID must be a string')
    .custom(async (developerId) => {
        const developer = await User.findById(developerId);
        if (!developer) {
            throw new Error('Developer not found');
        }
        return true;
    }),
    body('projectCredentials.name').notEmpty().withMessage('Project name is required'),
    body('projectCredentials.developers').optional().isArray().withMessage('Developers must be an array of developer IDs'),
    body('description').optional().isString().withMessage('Description must be a string'),
    body('status').optional().isIn(statusEnum).withMessage('Invalid status value'),
    body('priority').optional().isIn(priorityEnum).withMessage('Invalid priority value')
];

const validationUpdateProject = [
    body('developerID')
    .optional().notEmpty().withMessage('DeveloperID is required')
    .isString().withMessage('Developer ID must be a string')
    .custom(async (developerId) => {
        const developer = await User.findById(developerId);
        if (!developer) {
            throw new Error('Developer not found');
        }
        return true;
    }),
    body('projectCredentials.name').optional().notEmpty().withMessage('Project name is required'),
    body('projectCredentials.developers').optional().isArray().withMessage('Developers must be an array of developer IDs'),
    body('description').optional().isString().withMessage('Description must be a string'),
    body('status').optional().isIn(statusEnum).withMessage('Invalid status value'),
    body('priority').optional().isIn(priorityEnum).withMessage('Invalid priority value')
];

const ValidateMakeTaskClose = [
    param('taskId').isMongoId().withMessage('Invalid task ID format'),
    body('executionTime')
        .notEmpty().withMessage('Execution time is required')
        .isNumeric().withMessage('Execution time must be a number'),
    param('taskId').custom(async (taskId) => {
        const task = await Task.findById(taskId);
        if (!task) {
            throw new Error('Task not found');
        }
        if (!task.credentials || !task.credentials.assignedTo) {
            throw new Error('Assign a user to the task');
        }
        return true;
    })
]

const fibonacciNumbersUpTo100 = [1, 2, 3, 5, 8, 13, 21, 34, 55, 89];

const isFibonacci = value => {
    if (!fibonacciNumbersUpTo100.includes(Number(value))) {
        return Promise.reject('Estimation must be a Fibonacci number between 1 and 100 (1, 2, 3, 5, 8, 13, 21, 34, 55, 89)');
    }
    return true
};

const validationCreateTask = [
    body('projectId')
    .notEmpty().withMessage('Project ID is required')
    .isMongoId().withMessage('Invalid project ID format')
    .custom(async (projectId) => {
        const project = await Project.findById(projectId);
        if (!project) {
            throw new Error('Project not found');
        }
        return true;
    }),
    body('credentials.name').notEmpty().withMessage('Task name is required'),
    body('credentials.assignedTo').optional().isMongoId().withMessage('Assigned developer ID must be a valid MongoDB ObjectId'),
    body('credentials.estimation')
    .isNumeric().withMessage('Estimation must be a number')
    .custom(isFibonacci),
    body('credentials.specialization')
    .isIn(specializationsEnum).withMessage('Invalid specialization'),
    body('state').isIn(stateEnum).withMessage('Invalid state value'),
    body('createdBy')
    .notEmpty().withMessage('Developer is required')
    .isMongoId().withMessage('Creator developer ID must be a valid MongoDB ObjectId')
    .custom(async (userId) => {
        const user = await User.findById(userId);
        if (!user) {
            throw new Error('User not found');
        }
        return true;
    }),
    body('dateRange.startDate').optional().isISO8601().withMessage('Start date must be a valid date').custom((value, { req }) => {
        if (new Date(value) > new Date(req.body.dateRange.endDate)) {
            throw new Error('Start date must be before end date');
        }
        return true;
    }),
    body('dateRange.endDate').optional().isISO8601().withMessage('End date must be a valid date'),
    body('executionTime').isEmpty().withMessage('Execution time is not allowed')
];

const validationUpdateTask = [
    body('projectId')
    .optional().notEmpty().withMessage('Project ID is required')
    .isMongoId().withMessage('Invalid project ID format')
    .custom(async (projectId) => {
        const project = await Project.findById(projectId);
        if (!project) {
            throw new Error('Project not found');
        }
        return true;
    }),
    body('credentials.name').optional().notEmpty().withMessage('Task name is required'),
    body('credentials.assignedTo').optional().isMongoId().withMessage('Assigned developer ID must be a valid MongoDB ObjectId'),
    body('credentials.estimation')
    .optional()
    .isNumeric().withMessage('Estimation must be a number')
    .custom(isFibonacci),
    body('credentials.specialization')
    .optional()
    .isIn(specializationsEnum).withMessage('Invalid specialization'),
    body('state').optional().isIn(stateEnum).withMessage('Invalid state value'),
    body('createdBy')
    .optional()
    .notEmpty().withMessage('Developer is required')
    .isMongoId().withMessage('Creator developer ID must be a valid MongoDB ObjectId')
    .custom(async (userId) => {
        const user = await User.findById(userId);
        if (!user) {
            throw new Error('User not found');
        }
        return true;
    }),
    body('dateRange.startDate').optional().isISO8601().withMessage('Start date must be a valid date').custom((value, { req }) => {
        if (new Date(value) > new Date(req.body.dateRange.endDate)) {
            throw new Error('Start date must be before end date');
        }
        return true;
    }),
    body('dateRange.endDate').optional().isISO8601().withMessage('End date must be a valid date'),
    body('executionTime').optional().isEmpty().withMessage('Execution time is not allowed')
];

module.exports = {
    validationUser,
    validationSpecialization,
    validationProject,
    validationTask,
    validationUpdateDeveloper,
    validationHandleAssignment,
    validationCreateProject,
    validationUpdateProject,
    validationUpdateTask,
    ValidateMakeTaskClose,
    validationCreateTask,
    validationUpdateProject
  };