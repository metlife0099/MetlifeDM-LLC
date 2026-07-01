import xss from 'xss';

const clean = (val) => {
  if (typeof val === 'string') return xss(val);
  if (Array.isArray(val)) return val.map(clean);
  if (val && typeof val === 'object') {
    const out = {};
    for (const k of Object.keys(val)) out[k] = clean(val[k]);
    return out;
  }
  return val;
};

/**
 * xss-clean replacement — deep sanitize req.body, req.query, req.params.
 * Skips fields listed in `skipFields` (e.g. rich blog content that trusts admin input).
 */
export const xssClean = (skipFields = []) => (req, res, next) => {
  const sanitize = (source) => {
    if (!req[source]) return;
    for (const key of Object.keys(req[source])) {
      if (skipFields.includes(key)) continue;
      req[source][key] = clean(req[source][key]);
    }
  };
  sanitize('body');
  sanitize('query');
  sanitize('params');
  next();
};
