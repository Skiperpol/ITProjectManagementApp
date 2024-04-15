const express = require('express')
const router = express.Router()
const { Verify, VerifyRole } = require('../middlewares/verify')
const { validationSpecialization, validationUser, validationProject, validationUpdateDeveloper } = require('../middlewares/validations.js')
const { Validate } = require('../middlewares/validate.js')

const  { 
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
} = require('../controllers/developer')

router.get('/users', getDevelopers)
router.get('/user/:userId', Verify, validationUser, Validate, getDeveloper)
router.get('/users/:specialization', Verify, validationSpecialization, Validate, getDevelopersBySpecialization)
router.get('/user/:userId/project/:projectId/tasks', Verify, validationUser, validationProject, Validate, getDeveloperTasksInProject)
router.get('/user/:userId/projects', Verify, validationUser, Validate, getDeveloperProjects)
router.get('/user/:userId/tasks', Verify, validationUser, Validate, getDeveloperTasks)
router.patch('/user/:userId', Verify, VerifyRole, validationUser, validationUpdateDeveloper, Validate, updateDeveloper)
router.patch('/user/:userId/project/:projectId', Verify, VerifyRole, validationUser, validationProject, Validate, addProjectIDToDeveloper)
router.delete('/users', Verify, VerifyRole, removeDevelopers)
router.delete('/user/:userId', Verify, VerifyRole, validationUser, Validate, removeDeveloper)

module.exports = router