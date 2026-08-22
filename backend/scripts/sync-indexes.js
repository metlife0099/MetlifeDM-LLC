import connectDatabase, { disconnectDatabase } from '../src/config/database.js';
import { User, Order, Payment } from '../src/models/index.js';
import logger from '../src/config/logger.js';

const scalarUniqueFields = [
  [User, 'stripeCustomerId'],
  [Order, 'checkoutIdempotencyKey'],
  [Order, 'stripePaymentIntentId'],
  [Order, 'stripeSubscriptionId'],
  [Payment, 'stripePaymentIntentId'],
  [Payment, 'stripeInvoiceId'],
];

const findDuplicates = async (model, field, unwind) => {
  const pipeline = [];
  if (unwind) pipeline.push({ $unwind: `$${unwind}` });
  pipeline.push(
    { $match: { [field]: { $exists: true, $nin: [null, ''] } } },
    { $group: { _id: `$${field}`, count: { $sum: 1 }, documents: { $push: '$_id' } } },
    { $match: { count: { $gt: 1 } } },
    { $limit: 20 }
  );
  return model.aggregate(pipeline);
};

const run = async () => {
  await connectDatabase();
  const duplicateReports = [];
  for (const [model, field] of scalarUniqueFields) {
    const duplicates = await findDuplicates(model, field);
    if (duplicates.length) duplicateReports.push({ model: model.modelName, field, duplicates });
  }
  const refundDuplicates = await findDuplicates(Payment, 'refunds.requestId', 'refunds');
  if (refundDuplicates.length) {
    duplicateReports.push({ model: Payment.modelName, field: 'refunds.requestId', duplicates: refundDuplicates });
  }

  if (duplicateReports.length) {
    for (const report of duplicateReports) {
      logger.error(`Duplicate values block ${report.model}.${report.field}`, {
        duplicates: report.duplicates,
      });
    }
    throw new Error('Index preflight failed; resolve duplicate provider IDs without deleting data, then rerun');
  }

  // createIndexes adds missing declared indexes and does not drop unrelated
  // indexes. This script is intentionally operator-run, never startup-run.
  for (const model of [User, Order, Payment]) await model.createIndexes();
  logger.info('Unique-index preflight passed and declared indexes were created');
};

try {
  await run();
} catch (error) {
  logger.error(`Index setup failed: ${error.message}`);
  process.exitCode = 1;
} finally {
  await disconnectDatabase();
}
