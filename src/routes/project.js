const express = require('express')
const router = express.Router()
const { Verify, VerifyRole } = require('../middlewares/verify')
const { validationProject, validationHandleAssignment, validationUpdateProject, validationCreateProject } = require('../middlewares/validations.js')
const { Validate } = require('../middlewares/validate.js')

const  { 
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
} = require('../controllers/project')

router.get('/projects', Verify, getProjects)
router.get('/project/:projectId', Verify, validationProject, Validate, getProject)
router.get('/project/:projectId/tasks', Verify, validationProject, Validate, getProjectTasks)
router.get('/project/:projectId/assignment', Verify, validationProject, Validate, getTaskAssignment)
router.put('/project/:projectId/assignment', Verify, VerifyRole, validationProject, validationHandleAssignment, Validate, handleAssignment)
router.post('/project/:projectId/assignment', Verify, VerifyRole, validationProject, Validate, createTaskAssignment)
router.post('/project', Verify, VerifyRole, validationCreateProject, Validate, createProject)
router.patch('/project/:projectId', Verify, VerifyRole, validationUpdateProject, validationProject, Validate, updateProject)
router.delete('/project/:projectId', Verify, VerifyRole, validationProject, Validate, removeProject)
router.delete('/projects', Verify, VerifyRole, removeProjects)

module.exports = router