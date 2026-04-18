import 'dotenv/config';

const BASE = 'https://api.rhombusai.com';
const PROJECT_ID = process.env.RHOMBUS_PROJECT_ID;

let token = '';

// helper functions
function api(path, opts = {}) {
  return fetch(`${BASE}${path}`, {
    ...opts,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(opts.headers || {}),
    },
  });
}

function assert(condition, message) {
  if (!condition) {
    console.error(`FAIL: ${message}`);
    process.exitCode = 1;
  } else {
    console.log(`PASS: ${message}`);
  }
}

// tests

async function checkAuth() {
  console.log('\nAuthentication');
  token = process.env.RHOMBUS_TOKEN;
  assert(typeof token === 'string' && token.length > 0,
    'RHOMBUS_TOKEN is present in environment');

  const res = await api('/api/accounts/users/profile');
  assert(res.status === 200,
    `Token is valid - profile endpoint returns 200 (got ${res.status})`);
  console.log('Token verified');
}

async function checkProfile() {
  console.log('\nUser Profile');
  const res = await api('/api/accounts/users/profile');
  assert(res.status === 200, `GET /profile returns 200 (got ${res.status})`);

  const data = await res.json();
  assert('first_name' in data, 'Profile response has first_name field');
  assert('last_name' in data, 'Profile response has last_name field');
}

async function checkCredits() {
  console.log('\nCredits');
  const res = await api('/api/accounts/users/credits');
  assert(res.status === 200, `GET /credits returns 200 (got ${res.status})`);

  const text = await res.text();
  try {
    const data = JSON.parse(text);
    assert(typeof data === 'object' || Array.isArray(data),
      'Credits response is a valid JSON object');
  } catch {
    assert(false, 'Credits response is valid JSON');
  }
}

async function checkProjects() {
  console.log('\nProjects List');
  const res = await api('/api/dataset/projects/all?limit=20&offset=0');
  assert(res.status === 200, `GET /projects/all returns 200 (got ${res.status})`);

  const text = await res.text();
  try {
    const data = JSON.parse(text);
    assert(Array.isArray(data) || typeof data === 'object',
      'Projects response is valid JSON');
  } catch {
    assert(false, `Projects response is valid JSON (got HTML instead)`);
  }
}

async function checkDatasets() {
  console.log('\nDatasets for Project');
  const res = await api(`/api/dataset/analyzer/v2/projects/${PROJECT_ID}/datasets`);
  assert(res.status === 200, `GET /datasets returns 200 (got ${res.status})`);

  const data = await res.json();
  assert(Array.isArray(data) || typeof data === 'object',
    'Datasets response is valid JSON');
}

async function checkNodes() {
  console.log('\nPipeline Nodes');
  const res = await api(`/api/dataset/analyzer/v2/projects/${PROJECT_ID}/nodes`);
  assert(res.status === 200, `GET /nodes returns 200 (got ${res.status})`);

  const data = await res.json();
  assert(Array.isArray(data) || typeof data === 'object',
    'Nodes response is valid JSON');
}

async function checkUnauthorized() {
  console.log('\nNegative: Unauthorized request (no token)');
  const res = await fetch(`${BASE}/api/accounts/users/profile`, {
    headers: { 'Content-Type': 'application/json' },
  });
  assert(res.status === 401 || res.status === 403,
    `Request without token is rejected with 401/403 (got ${res.status})`);
}

async function checkInvalidProject() {
  console.log('\nNegative: Invalid project ID');
  const res = await api('/api/dataset/analyzer/v2/projects/999999999/datasets');
  assert(res.status === 404 || res.status === 403 || res.status === 400,
    `Invalid project ID returns error status (got ${res.status})`);
}

// main runner
async function run() {
  console.log('API Tests');
  try {
    await checkAuth();
    await checkUnauthorized();
    await checkCredits();
    await checkNodes();
    await checkProfile();
    await checkProjects();
    await checkDatasets();
    await checkInvalidProject();
  } catch (err) {
    console.error('\nUnexpected error:', err);
    process.exitCode = 1;
  }
  console.log('\nDone!');
}

run();