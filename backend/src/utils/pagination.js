import { PAGINATION } from './constants.js';

/**
 * Extract pagination + sort + search from query string.
 */
export const getPaginationOptions = (query = {}) => {
  const page = Math.max(1, parseInt(query.page, 10) || PAGINATION.DEFAULT_PAGE);
  const limit = Math.min(
    PAGINATION.MAX_LIMIT,
    Math.max(1, parseInt(query.limit, 10) || PAGINATION.DEFAULT_LIMIT)
  );
  const skip = (page - 1) * limit;

  const sort = {};
  if (query.sortBy) {
    const order = query.sortOrder === 'asc' ? 1 : -1;
    sort[query.sortBy] = order;
  } else {
    sort.createdAt = -1;
  }

  return { page, limit, skip, sort, search: query.search?.trim() || '' };
};

/**
 * Build a consistent paginated meta block.
 */
export const buildPaginationMeta = ({ total, page, limit }) => {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  return {
    total,
    page,
    limit,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
};

/**
 * Run a Mongoose model paginated query and return { items, meta }.
 */
export const paginate = async (
  model,
  filter = {},
  { page, limit, skip, sort },
  { populate, select, lean = true } = {}
) => {
  const query = model.find(filter).sort(sort).skip(skip).limit(limit);
  if (populate) query.populate(populate);
  if (select) query.select(select);
  if (lean) query.lean();

  const [items, total] = await Promise.all([query.exec(), model.countDocuments(filter)]);
  return { items, meta: buildPaginationMeta({ total, page, limit }) };
};
