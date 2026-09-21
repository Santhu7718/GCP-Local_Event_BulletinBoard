const express = require('express');
const {
    projectId,
    location,
    nodeEnv
} = require('../config');

const router = express.Router();

router.get('/', (req, res) => {
    res.json({
        ok: true,
        service: 'local-event-board-api',
        environment: nodeEnv,
        projectId: projectId || null,
        location,
        timestamp: new Date().toISOString()
    });
});

module.exports = router;