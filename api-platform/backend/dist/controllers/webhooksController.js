import { Webhook } from 'svix';
import { createUser, getUserByClerkId, } from '../models/index.js';
export async function clerkWebhook(req, res) {
    const secret = process.env.CLERK_WEBHOOK_SECRET;
    if (!secret) {
        console.error('CLERK_WEBHOOK_SECRET is not configured; rejecting webhook');
        return res.status(500).json({ error: 'Webhook not configured' });
    }
    const svixId = req.headers['svix-id'];
    const svixTimestamp = req.headers['svix-timestamp'];
    const svixSignature = req.headers['svix-signature'];
    if (!svixId || !svixTimestamp || !svixSignature) {
        return res.status(400).json({ error: 'Missing svix headers' });
    }
    // req.body is the raw Buffer here — express.raw() is mounted on /v1/webhooks
    // in index.ts specifically so the signature can be verified against the exact
    // bytes Clerk signed, before any JSON parsing.
    let payload;
    try {
        const wh = new Webhook(secret);
        payload = wh.verify(req.body, {
            'svix-id': svixId,
            'svix-timestamp': svixTimestamp,
            'svix-signature': svixSignature,
        });
    }
    catch (err) {
        console.error('Clerk webhook signature verification failed:', err);
        return res.status(400).json({ error: 'Invalid webhook signature' });
    }
    try {
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
            console.log('User created for:', email);
            res.json({ received: true, userId: clerkId });
        }
        else {
            res.json({ received: true, type: payload.type });
        }
    }
    catch (err) {
        console.error('Clerk webhook error:', err);
        res.status(500).json({ error: 'Webhook processing failed' });
    }
}
//# sourceMappingURL=webhooksController.js.map