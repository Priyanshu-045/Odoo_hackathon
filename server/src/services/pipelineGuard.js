// Author: Priyanshu Pandey | Enrollment: 0801e1241068
// Validates LLM-generated aggregation pipelines BEFORE they touch the database.
// Policy: read-only, allow-listed stages, allow-listed collections, no server-side JS.

export const ALLOWED_COLLECTIONS = new Set(['subscriptions', 'plans', 'products', 'invoices']); // users excluded on purpose (password hashes, PII)
const ALLOWED_STAGES = new Set(['$match', '$group', '$project', '$sort', '$limit', '$skip', '$lookup', '$unwind', '$count', '$addFields', '$set']);
const FORBIDDEN_OPS = new Set([
  '$function', '$accumulator', '$where',            // arbitrary JS
  '$out', '$merge',                                  // writes
  '$unionWith', '$graphLookup', '$facet',            // cross-collection / expensive
  '$currentOp', '$collStats', '$indexStats', '$listSessions', '$changeStream',
]);
const MAX_STAGES = 12;
export const RESULT_LIMIT = 200;

export class GuardError extends Error {}

/** Convert {"$date": "ISO"} wrappers (Extended JSON) into real Date objects. */
export function reviveDates(node) {
  if (Array.isArray(node)) return node.map(reviveDates);
  if (node && typeof node === 'object') {
    const keys = Object.keys(node);
    if (keys.length === 1 && keys[0] === '$date') {
      const d = new Date(node.$date);
      if (Number.isNaN(d.getTime())) throw new GuardError('Invalid $date value');
      return d;
    }
    return Object.fromEntries(keys.map((k) => [k, reviveDates(node[k])]));
  }
  return node;
}

function deepScan(node) {
  if (Array.isArray(node)) return node.forEach(deepScan);
  if (node instanceof Date || node === null || typeof node !== 'object') return;
  for (const [k, v] of Object.entries(node)) {
    if (FORBIDDEN_OPS.has(k)) throw new GuardError(`Operator ${k} is not allowed`);
    deepScan(v);
  }
}

export function validatePipeline(pipeline, depth = 0) {
  if (!Array.isArray(pipeline)) throw new GuardError('Pipeline must be an array');
  if (pipeline.length === 0 || pipeline.length > MAX_STAGES) throw new GuardError(`Pipeline must have 1-${MAX_STAGES} stages`);
  if (depth > 1) throw new GuardError('Pipelines nested too deeply');

  for (const stage of pipeline) {
    if (!stage || typeof stage !== 'object' || Array.isArray(stage) || Object.keys(stage).length !== 1)
      throw new GuardError('Each stage must be an object with exactly one operator');
    const [op] = Object.keys(stage);
    if (!ALLOWED_STAGES.has(op)) throw new GuardError(`Stage ${op} is not allowed`);
    deepScan(stage);

    if (op === '$limit' && !(Number.isInteger(stage.$limit) && stage.$limit > 0 && stage.$limit <= 1000))
      throw new GuardError('$limit must be an integer between 1 and 1000');
    if (op === '$lookup') {
      const { from, pipeline: sub } = stage.$lookup;
      if (typeof from !== 'string' || !ALLOWED_COLLECTIONS.has(from)) throw new GuardError(`$lookup into "${from}" is not allowed`);
      if (sub !== undefined) validatePipeline(sub, depth + 1);
    }
  }
  return pipeline;
}

/** Accepts {collection, pipeline} (preferred) or a bare array (defaults to subscriptions). */
export function parseModelOutput(parsed) {
  const collection = Array.isArray(parsed) ? 'subscriptions' : parsed?.collection;
  const raw = Array.isArray(parsed) ? parsed : parsed?.pipeline;
  if (!ALLOWED_COLLECTIONS.has(collection)) throw new GuardError(`Collection "${collection}" is not allowed`);
  const pipeline = validatePipeline(reviveDates(raw));
  // Hard cap on result size regardless of what the model asked for
  const last = pipeline[pipeline.length - 1];
  if (!('$limit' in last)) pipeline.push({ $limit: RESULT_LIMIT });
  return { collection, pipeline };
}
