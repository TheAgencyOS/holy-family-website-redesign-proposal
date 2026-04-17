/**
 * /api/tasks · public-write task board for the Holy Family portal.
 *
 * GET    /api/tasks                  → all tasks ordered by status then created_at
 * POST   /api/tasks                  → create a task
 * PATCH  /api/tasks?id=X             → partial update of a task
 *
 * Body shape on POST:
 *   {
 *     title:                string  (required, max 300),
 *     description?:         string,
 *     status?:              'todo' | 'in_progress' | 'done' | 'blocked',
 *     priority?:            'low' | 'normal' | 'high' | 'urgent',
 *     assignee_name?:       string,
 *     assignee_email?:      string,
 *     created_by_name:      string  (required),
 *     created_by_email?:    string,
 *     related_mockup_id?:   string,
 *     related_comment_id?:  uuid,
 *     due_date?:            'YYYY-MM-DD',
 *   }
 *
 * All responses use the shape: { data, error }.
 */

const { getSupabaseServer } = require('../lib/supabase-server');

const ALLOWED_STATUS = new Set(['todo', 'in_progress', 'done', 'blocked']);
const ALLOWED_PRIORITY = new Set(['low', 'normal', 'high', 'urgent']);
// Status sort order for the board: kanban left-to-right reading order.
const STATUS_RANK = { todo: 0, in_progress: 1, blocked: 2, done: 3 };

const SELECT_COLS =
  'id, title, description, status, priority, assignee_name, assignee_email, ' +
  'created_by_name, created_by_email, related_mockup_id, related_comment_id, ' +
  'due_date, created_at, updated_at';

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

function trimOrNull(v, max = 2000) {
  if (v == null) return null;
  const s = String(v).trim();
  if (!s) return null;
  if (s.length > max) return s.slice(0, max);
  return s;
}

function validDate(v) {
  if (!v) return null;
  const s = String(v).trim();
  // Accept YYYY-MM-DD only.
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const d = new Date(`${s}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return null;
  return s;
}

async function handleGet(req, res) {
  const supabase = getSupabaseServer();
  const { data, error } = await supabase
    .from('tasks')
    .select(SELECT_COLS)
    .order('created_at', { ascending: false });

  if (error) return send(res, 500, { data: null, error: error.message });

  // Sort in JS so the kanban order is enforced regardless of insert order.
  const sorted = (data || []).slice().sort((a, b) => {
    const sa = STATUS_RANK[a.status] ?? 99;
    const sb = STATUS_RANK[b.status] ?? 99;
    if (sa !== sb) return sa - sb;
    return new Date(b.created_at) - new Date(a.created_at);
  });

  return send(res, 200, { data: sorted, error: null });
}

async function handlePost(req, res) {
  const body = await readJsonBody(req);
  if (!body) return send(res, 400, { data: null, error: 'invalid_json' });

  const title = trimOrNull(body.title, 300);
  const created_by_name = trimOrNull(body.created_by_name, 200);
  if (!title) return send(res, 400, { data: null, error: 'title_required' });
  if (!created_by_name) {
    return send(res, 400, { data: null, error: 'created_by_name_required' });
  }

  const status = ALLOWED_STATUS.has(body.status) ? body.status : 'todo';
  const priority = ALLOWED_PRIORITY.has(body.priority) ? body.priority : 'normal';

  const insert = {
    title,
    description: trimOrNull(body.description, 4000),
    status,
    priority,
    assignee_name: trimOrNull(body.assignee_name, 200),
    assignee_email: trimOrNull(body.assignee_email, 200),
    created_by_name,
    created_by_email: trimOrNull(body.created_by_email, 200),
    related_mockup_id: trimOrNull(body.related_mockup_id, 100),
    related_comment_id: trimOrNull(body.related_comment_id, 64),
    due_date: validDate(body.due_date),
  };

  const supabase = getSupabaseServer();
  const { data, error } = await supabase
    .from('tasks')
    .insert(insert)
    .select(SELECT_COLS)
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
  if (body.title !== undefined) {
    const t = trimOrNull(body.title, 300);
    if (!t) return send(res, 400, { data: null, error: 'title_cannot_be_empty' });
    patch.title = t;
  }
  if (body.description !== undefined) {
    patch.description = trimOrNull(body.description, 4000);
  }
  if (body.status !== undefined) {
    if (!ALLOWED_STATUS.has(body.status)) {
      return send(res, 400, { data: null, error: 'invalid_status' });
    }
    patch.status = body.status;
  }
  if (body.priority !== undefined) {
    if (!ALLOWED_PRIORITY.has(body.priority)) {
      return send(res, 400, { data: null, error: 'invalid_priority' });
    }
    patch.priority = body.priority;
  }
  if (body.assignee_name !== undefined) {
    patch.assignee_name = trimOrNull(body.assignee_name, 200);
  }
  if (body.assignee_email !== undefined) {
    patch.assignee_email = trimOrNull(body.assignee_email, 200);
  }
  if (body.due_date !== undefined) {
    patch.due_date = body.due_date === null ? null : validDate(body.due_date);
  }

  if (Object.keys(patch).length === 0) {
    return send(res, 400, { data: null, error: 'no_updatable_fields' });
  }

  const supabase = getSupabaseServer();
  const { data, error } = await supabase
    .from('tasks')
    .update(patch)
    .eq('id', id)
    .select(SELECT_COLS)
    .single();

  if (error) return send(res, 500, { data: null, error: error.message });
  if (!data) return send(res, 404, { data: null, error: 'not_found' });
  return send(res, 200, { data, error: null });
}

async function handleTasks(req, res) {
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

module.exports = handleTasks;
module.exports.default = handleTasks;
module.exports.handleTasks = handleTasks;
