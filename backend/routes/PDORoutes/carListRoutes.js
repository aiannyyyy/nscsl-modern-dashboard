const express = require("express");
const router = express.Router();
const upload = require("../../config/multer"); // Your existing multer config
const carListController = require("../../controllers/PDOController/carListController");

// Get all car list
router.get("/car-list", carListController.getAllCarList);

// Get filtered car list by status and date range
router.get("/car-filtered", carListController.getFilteredCarList);

// Get car list grouped by province
router.get("/car-list/grouped-by-province", carListController.getCarListGroupedByProvince);

// Get car list grouped by sub_code1 (for pie chart with date range filter)
router.get("/car-list/grouped", carListController.getCarListGrouped);

// ⭐ Get next case number for auto-generation
router.get("/car-list/next-case-number", carListController.getNextCaseNumber);

// Get facility details by code (Oracle lookup)
router.get("/facility", carListController.getFacilityByCode);

// Add new car record with file upload
router.post("/add-car", upload.single("attachment"), carListController.addCar);

// ⭐ NEW: Update car record with file upload
router.put("/car-list/:id", upload.single("attachment"), carListController.updateCar);

// Update status of a car record
router.post("/update-status", carListController.updateStatus);

// Delete car record
router.delete("/car-list/:id", carListController.deleteCar);

// Test database connection
router.get("/test-db", carListController.testDatabaseConnection);

module.exports = router;