import { Router } from 'express';
import express from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import ApiError from '../utils/ApiError.js';
import { handleWebhookEvent } from '../services/stripe.service.js';

/**
 * Stripe webhook — mounted BEFORE the JSON body parser so it receives raw bytes.
 */
const router = Router();

router.post(
  '/stripe',
  express.raw({ type: 'application/json' }),
  asyncHandler(async (req, res) => {
    const signature = req.headers['stripe-signature'];
    if (!signature) throw ApiError.badRequest('Missing Stripe signature');
    const result = await handleWebhookEvent(req.body, signature);
    return ApiResponse.ok(res, result, 'Webhook processed');
  })
);

export default router;
