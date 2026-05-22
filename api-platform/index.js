const express = require('express');

const app = express();

const customers = {

    customerId: {
        apiKey: '1234567890abcdef',
        active: true,
        itemIds: 'itemid',
        calls: 0
    },
}

const apiKeys = {
    // apiKey: customer
    '1234567890abcdef': 'customer1'
};


function generateApiKey() {
    const {randomBytes, hash} = require('crypto');
    const apiKey = randomBytes(16).toString('hex');
    const hashedAPIKey = hashAPIKey(apiKey);

    if (apiKeys[hashedAPIKey]) {
        return generateApiKey();
    } else {
        return {hashedAPIKey, apiKey};
    }
}


function hashAPIKey(apiKey) {
    const {createHash} = require('crypto');
    return createHash('md5').update(apiKey).digest('hex');

    return hashedAPIKey;
}


app.get('/api', (req, res) => {

    const apiKey = req.query.apiKey;

    if (!apiKey) {
        return res.status(400).send({ error: 'API key is required' });
    }

    const hashedAPIKey = hashAPIKey(apiKey);

    const customerId = apiKeys[hashedAPIKey];

    if (!customerId) {
        return res.status(401).send({ error: 'Invalid API key' });
    }   

    const customer = customers[customerId];
    
    if (!customer.active) {
        return res.status(403).send({ error: 'API key is inactive' });
    }


    
  res.send({ message: 'Hello from the API!' });
});


app.listen(8080, () => {
  console.log('Server is running on http://localhost:8080');
});