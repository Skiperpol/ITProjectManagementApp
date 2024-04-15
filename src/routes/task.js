const express = require('express')
const router = express.Router()
const { Verify, VerifyRole } = require('../middlewares/verify')
const { validationTask, ValidateMakeTaskClose, validationUpdateTask, validationCreateTask } = require('../middlewares/validations.js')
const { Validate } = require('../middlewares/validate.js')

const  { 
    createTask,
    getTasks,
    getTask,
    removeTask,
    removeTasks,
    updateTask,
    makeTaskClosed
} = require('../controllers/task')

router.get('/tasks', Verify, getTasks)
router.get('/task/:taskId', Verify, validationTask, Validate, getTask)
router.patch('/task/:taskId/close', Verify, VerifyRole, validationTask, ValidateMakeTaskClose, Validate, makeTaskClosed)
router.post('/task', Verify, VerifyRole, validationCreateTask, Validate, createTask)
router.patch('/task/:taskId', Verify, VerifyRole, validationTask, validationUpdateTask, Validate, updateTask)
router.delete('/task/:taskId', Verify, VerifyRole, validationTask, Validate, removeTask)
router.delete('/tasks', Verify, VerifyRole, removeTasks)

module.exports = router