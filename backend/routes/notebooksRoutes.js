const express = require('express');
const router = express.Router();
const notebooksController = require('../controllers/notebooksController');
const mysqlNotebooksController = require('../controllers/mysqlNotebooksController');
const upload = require('../config/multer');

// Search for patients (Oracle)
router.get('/search', notebooksController.searchPatients);

// Get complete patient details (demographics + disorders) - Oracle
router.get('/complete-details', notebooksController.getCompletePatientDetails);

// Get patient notebooks by labno (Oracle - PHCMS.SAMPLE_NOTES_ARCHIVE)
router.get('/notebooks', notebooksController.getPatientNotebooks);

// 🆕 Get MySQL notebook entries (pdo_notebook table)
router.get('/mysql-entries', mysqlNotebooksController.getNotebookEntriesFromMySQL);

// ✅ FIXED: Get recent notebook entries from MySQL controller
router.get('/recent', mysqlNotebooksController.getRecentNotebooks);

// 🆕 Add new notebook entry with multiple file uploads (MySQL - pdo_notebook)
router.post('/add-notebook', upload.array('files', 10), mysqlNotebooksController.addNotebookEntry);

// Get patient details by lab number (DEPRECATED - kept for backward compatibility)
router.get('/patient/:labno', notebooksController.getPatientDetails);

// 🆕 Fetch patient image by lab number
router.get('/fetch-image', mysqlNotebooksController.fetchImage);

module.exports = router;