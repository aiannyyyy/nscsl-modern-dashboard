const express = require('express');
const router = express.Router();
const lopezFilterCardController = require('../../controllers/PDOController/lopezFilterCardController');

router.get('/lopez-purchased-filter-cards', lopezFilterCardController.getLopezPurchasedFilterCards);

module.exports = router;