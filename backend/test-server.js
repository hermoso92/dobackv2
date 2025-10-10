const express = require('express');
const app = express();
const PORT = 3001;

app.get('/health', (req, res) => {
    res.json({ status: 'OK', message: 'Test server working' });
});

app.listen(PORT, () => {
    console.log(`Test server running on port ${PORT}`);
});
