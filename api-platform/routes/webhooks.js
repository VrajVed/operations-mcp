const express = require('express');
const router = express.Router();
const { generateApiKey } = require('../services/apiKeyService');
const {
  createUser,
  getUserByClerkId,
  createApiKey,
} = require('../db/queries');

// POST /v1/webhooks/clerk - Handle Clerk user.created events
router.post('/clerk', async (req, res) => {
  try {
    const payload = JSON.parse(req.body);
    console.log('Clerk webhook received:', payload.type);

    if (payload.type === 'user.created') {
      const clerkId = payload.data.id;
      const email = payload.data.email_addresses?.[0]?.email_address;

      if (!email) {
        return res.status(400).json({ error: 'Email not found in webhook payload' });
      }

      const existing = await getUserByClerkId(clerkId);
      if (existing) {
        return res.json({ received: true, userId: clerkId, note: 'User already exists' });
      }

      await createUser(clerkId, email);

      const { apiKey, hashedAPIKey, mask } = generateApiKey();
      await createApiKey(clerkId, 'Free Key', hashedAPIKey, mask, true);

      console.log('User and free key created for:', email);
      res.json({ received: true, userId: clerkId, freeKeyCreated: true });
    } else {
      res.json({ received: true, type: payload.type });
    }
  } catch (err) {
    console.error('Clerk webhook error:', err);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

module.exports = router;
