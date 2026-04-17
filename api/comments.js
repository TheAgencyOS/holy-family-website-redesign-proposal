/**
 * /api/comments · public-write threaded comments on mockup pages.
 *
 * GET    /api/comments?mockup_id=X   → returns comments for that mockup,
 *                                       threaded (top-level first, replies nested)
 * GET    /api/comments               → returns the latest comments across all
 *                                       mockups (for the portal stream), flat
 *                                       and joined to mockups for display.
 * POST   /api/comments               → create a comment.
 *                                       Body: { mockup_id, parent_id?,
 *                                               author_name, author_email?,
 *                                               body, selector? }
 * PATCH  /api/comments?id=X          → update a comment (resolved flag).
 *                                       Body: { resolved: bool }
 *
 * All responses use the shape: { data, error }.
 *
 * Public-write phase: no auth, no rate limiting in code. RLS in the DB
 * permits anon writes. Tighten when we ship login.
 */

const { getSupabaseServer } = require('../lib/supabase-server');

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function send(res, status, payload) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(payload));
}

async function readJsonBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  if (chunks.length === 0) return {};
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
  } catch {
    return null;
  }
}

function parseQuery(req) {
  const url = new URL(req.url || '/', 'http://localhost');
  return Object.fromEntries(url.searchParams.entries());
}

function trimOrNull(v, max = 4000) {
  if (v == null) return null;
  const s = String(v).trim();
  if (!s) return null;
  if (s.length > max) return s.slice(0, max);
  return s;
}

function threadComments(rows) {
  // Build a quick lookup: id → { ...row, replies: [] }
  const byId = new Map();
  rows.forEach((r) => byId.set(r.id, { ...r, replies: [] }));
  const roots = [];
  rows.forEach((r) => {
    const node = byId.get(r.id);
    if (r.parent_id && byId.has(r.parent_id)) {
      byId.get(r.parent_id).replies.push(node);
    } else {
      roots.push(node);
    }
  });
  // Sort roots oldest-first (so the conversation reads top-down); replies same.
  const byCreated = (a, b) => new Date(a.created_at) - new Date(b.created_at);
  roots.sort(byCreated);
  roots.forEach((r) => r.replies.sort(byCreated));
  return roots;
}

async function handleGet(req, res) {
  const { mockup_id, limit } = parseQuery(req);
  const supabase = getSupabaseServer();

  if (mockup_id) {
    // All comments for one mockup, threaded.
    const { data, error } = await supabase
      .from('comments')
      .select('id, mockup_id, parent_id, author_name, author_email, body, resolved, selector, section_id, section_label, created_at')
      .eq('mockup_id', mockup_id)
      .order('created_at', { ascending: true });

    if (error) return send(res, 500, { data: null, error: error.message });
    return send(res, 200, { data: threadComments(data || []), error: null });
  }

  // Stream view: latest comments across all mockups, joined to the mockup name.
  const cap = Math.min(parseInt(limit, 10) || 50, 200);
  const { data, error } = await supabase
    .from('comments')
    .select(`
      id, mockup_id, parent_id, author_name, author_email, body, resolved, selector, section_id, section_label, created_at,
      mockups ( id, name, url_path )
    `)
    .order('created_at', { ascending: false })
    .limit(cap);

  if (error) return send(res, 500, { data: null, error: error.message });
  return send(res, 200, { data: data || [], error: null });
}

async function handlePost(req, res) {
  const body = await readJsonBody(req);
  if (!body) return send(res, 400, { data: null, error: 'invalid_json' });

  const mockup_id = trimOrNull(body.mockup_id, 100);
  const parent_id = trimOrNull(body.parent_id, 64);
  const author_name = trimOrNull(body.author_name, 200);
  const author_email = trimOrNull(body.author_email, 200);
  const text = trimOrNull(body.body, 4000);
  const selector = trimOrNull(body.selector, 500);
  const section_id = trimOrNull(body.section_id, 200);
  const section_label = trimOrNull(body.section_label, 280);

  if (!mockup_id) return send(res, 400, { data: null, error: 'mockup_id_required' });
  if (!author_name) return send(res, 400, { data: null, error: 'author_name_required' });
  if (!text) return send(res, 400, { data: null, error: 'body_required' });

  const supabase = getSupabaseServer();

  // Confirm the mockup_id exists so we don't insert orphaned rows.
  const { data: mock, error: mockErr } = await supabase
    .from('mockups')
    .select('id')
    .eq('id', mockup_id)
    .maybeSingle();
  if (mockErr) return send(res, 500, { data: null, error: mockErr.message });
  if (!mock) return send(res, 400, { data: null, error: 'unknown_mockup_id' });

  const insert = {
    mockup_id,
    parent_id: parent_id || null,
    author_name,
    author_email: author_email || null,
    body: text,
    selector: selector || null,
    section_id: section_id || null,
    section_label: section_label || null,
  };

  const { data, error } = await supabase
    .from('comments')
    .insert(insert)
    .select('id, mockup_id, parent_id, author_name, author_email, body, resolved, selector, section_id, section_label, created_at')
    .single();

  if (error) return send(res, 500, { data: null, error: error.message });
  return send(res, 201, { data, error: null });
}

async function handlePatch(req, res) {
  const { id } = parseQuery(req);
  if (!id) return send(res, 400, { data: null, error: 'id_required' });

  const body = await readJsonBody(req);
  if (!body) return send(res, 400, { data: null, error: 'invalid_json' });

  const patch = {};
  if (typeof body.resolved === 'boolean') patch.resolved = body.resolved;
  if (typeof body.body === 'string') {
    const t = trimOrNull(body.body, 4000);
    if (t) patch.body = t;
  }
  if (Object.keys(patch).length === 0) {
    return send(res, 400, { data: null, error: 'no_updatable_fields' });
  }

  const supabase = getSupabaseServer();
  const { data, error } = await supabase
    .from('comments')
    .update(patch)
    .eq('id', id)
    .select('id, mockup_id, parent_id, author_name, author_email, body, resolved, selector, section_id, section_label, created_at')
    .single();

  if (error) return send(res, 500, { data: null, error: error.message });
  if (!data) return send(res, 404, { data: null, error: 'not_found' });
  return send(res, 200, { data, error: null });
}

async function handleComments(req, res) {
  setCors(res);

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  try {
    if (req.method === 'GET') return await handleGet(req, res);
    if (req.method === 'POST') return await handlePost(req, res);
    if (req.method === 'PATCH') return await handlePatch(req, res);
    return send(res, 405, { data: null, error: 'method_not_allowed' });
  } catch (e) {
    return send(res, 500, { data: null, error: String(e.message || e) });
  }
}

module.exports = handleComments;
module.exports.default = handleComments;
module.exports.handleComments = handleComments;
