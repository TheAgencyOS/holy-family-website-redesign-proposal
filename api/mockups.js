/**
 * /api/mockups · read-only catalog of mockup pages that can be commented on.
 *
 * GET /api/mockups → { data: [ { id, name, url_path, description }, ... ], error: null }
 *
 * The catalog is seeded in db/001_initial_schema.sql. We only expose read here;
 * writes happen at migration time.
 */

const { getSupabaseServer } = require('../lib/supabase-server');

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function send(res, status, payload) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(payload));
}

async function handleMockups(req, res) {
  setCors(res);

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  if (req.method !== 'GET') {
    return send(res, 405, { data: null, error: 'method_not_allowed' });
  }

  let supabase;
  try {
    supabase = getSupabaseServer();
  } catch (e) {
    return send(res, 500, { data: null, error: String(e.message || e) });
  }

  const { data, error } = await supabase
    .from('mockups')
    .select('id, name, url_path, description, created_at')
    .order('name', { ascending: true });

  if (error) {
    return send(res, 500, { data: null, error: error.message || 'db_error' });
  }

  return send(res, 200, { data: data || [], error: null });
}

module.exports = handleMockups;
module.exports.default = handleMockups;
module.exports.handleMockups = handleMockups;
