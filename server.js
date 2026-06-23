const http = require('http');
const fs = require('fs');
const path = require('path');

// ═══════════════════════════════════════════════════════════════════
//  CONFIGURATION
// ═══════════════════════════════════════════════════════════════════
const PORT = 8080;
const DATA_ROOT = path.join(__dirname, 'data');
const REF_ROOT = path.join(__dirname, 'ref');

// Asset categories — each project gets these subfolders under Assets/
const ASSET_CATEGORIES = [
  'Ammo',
  'Armors',
  'Bundles',
  'Consumables',
  'Crafting Recipes',
  'Datadisks',
  'Descriptors/Ammo',
  'Descriptors/Firemodes',
  'Descriptors/Weapons',
  'Explosions',
  'FactionRewards',
  'Firemodes',
  'Localization/Ammo',
  'Localization/Weapons',
  'Weapons',
];

// Valid image suffixes
const IMAGE_SUFFIXES = ['sprite_icon', 'sprite_floor', 'sprite_shadow', 'sprite'];

// Ensure data root exists
if (!fs.existsSync(DATA_ROOT)) fs.mkdirSync(DATA_ROOT, { recursive: true });

// ═══════════════════════════════════════════════════════════════════
//  STATIC FILE SERVER
// ═══════════════════════════════════════════════════════════════════
const MIME = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

function serveStatic(req, res) {
  const urlPath = req.url === '/' ? 'index.html' : req.url.split('?')[0];
  const filePath = path.normalize(path.join(__dirname, urlPath));

  // Containment guard — never serve anything outside the app directory
  if (!filePath.startsWith(__dirname + path.sep) && filePath !== __dirname) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  const ext = path.extname(filePath);
  const mime = MIME[ext] || 'application/octet-stream';

  if (!fs.existsSync(filePath)) {
    res.writeHead(404);
    res.end('Not found');
    return;
  }

  res.writeHead(200, { 'Content-Type': mime });
  fs.createReadStream(filePath).pipe(res);
}

// ═══════════════════════════════════════════════════════════════════
//  API ROUTER
// ═══════════════════════════════════════════════════════════════════
async function handleApi(req, res, query) {
  res.setHeader('Content-Type', 'application/json');
  const action = query.action || '';
  const method = req.method;

  try {
    switch (action) {

      // ── Projects ──────────────────────────────────────────
      case 'projects':
        return json(res, listProjects());

      case 'project':
        if (method === 'POST') return json(res, createProject(await readBody(req)));
        return json(res, getProject(query.id));

      case 'project_rename':
        return json(res, renameProject(await readBody(req)));

      case 'project_delete':
        return json(res, deleteProject(query.id));

      case 'project_settings':
        if (method === 'POST') return json(res, saveProjectSettings(await readBody(req)));
        return json(res, getProjectSettings(query.id));

      // ── Assets (CRUD) ────────────────────────────────────
      case 'assets':
        return json(res, listAssets(query.project, query.category));

      case 'asset':
        if (method === 'POST') return json(res, saveAsset(await readBody(req)));
        return json(res, getAsset(query.project, query.category, query.id));

      case 'asset_delete':
        return json(res, deleteAsset(query.project, query.category, query.id));

      // ── Bulk / Utility ────────────────────────────────────
      case 'categories':
        return json(res, { categories: ASSET_CATEGORIES });

      case 'project_tree':
        return json(res, getProjectTree(query.id));

      // ── Images ─────────────────────────────────────────────
      case 'image_upload':
        return json(res, uploadImage(await readBody(req)));

      case 'image_rename':
        return json(res, renameImages(await readBody(req)));

      case 'image':
        return serveImage(res, query.project, query.id, query.suffix || 'sprite_icon', query.folder || '');

      case 'image_folders':
        return json(res, listImageFolders(query.project));

      case 'image_folders_save':
        return json(res, saveImageFolders(await readBody(req)));

      case 'image_folder_check':
        return json(res, checkImageFolder(query.project, query.folder));

      case 'image_find':
        return json(res, findImageFolder(query.project, query.id));

      case 'image_move':
        return json(res, moveImages(await readBody(req)));

      case 'health':
        return json(res, { status: 'ok', timestamp: Date.now() });

      // ── Reference Data ─────────────────────────────────────
      case 'ref_list':
        return json(res, listRefFiles());

      case 'ref':
        return json(res, getRefData(query.folder, query.file));

      case 'ref_all':
        return json(res, getAllRefData());

      case 'ref_update':
        if (method === 'POST') return json(res, await updateRefData(await readBody(req)));
        return json(res, { error: 'POST required' });

      case 'export_project':
        return exportProject(res, query.id);

      default:
        res.writeHead(404);
        return json(res, { error: `Unknown action: ${action}` });
    }
  } catch (err) {
    if (!res.headersSent) res.writeHead(err.status || 500);
    json(res, { error: err.message });
  }
}

// ═══════════════════════════════════════════════════════════════════
//  PROJECTS
// ═══════════════════════════════════════════════════════════════════

function listProjects() {
  if (!fs.existsSync(DATA_ROOT)) return { projects: [] };
  const dirs = fs.readdirSync(DATA_ROOT, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => {
      const assetsDir = path.join(DATA_ROOT, d.name, 'Assets');
      let assetCount = 0;
      if (fs.existsSync(assetsDir)) {
        for (const cat of ['Weapons', 'Ammo', 'Firemodes']) {
          const catDir = path.join(assetsDir, cat);
          if (fs.existsSync(catDir)) assetCount += glob(catDir, '.json').length;
        }
      }
      return { id: d.name, name: d.name, assetCount };
    })
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));

  return { projects: dirs };
}

function getProject(id) {
  id = sanitizeProjectId(id);
  const dir = path.join(DATA_ROOT, id);
  if (!id || !fs.existsSync(dir)) throw httpErr(404, 'Project not found');
  return { id, name: id };
}

function createProject(input) {
  const name = (input.name || '').trim();
  if (!name) throw httpErr(400, 'Project name is required');

  const id = sanitizeProjectId(name);
  if (!id) throw httpErr(400, 'Invalid project name');

  const dir = path.join(DATA_ROOT, id);
  if (fs.existsSync(dir)) throw httpErr(409, 'Project already exists');

  // Create project with all asset category subfolders
  fs.mkdirSync(dir, { recursive: true });
  const assetsDir = path.join(dir, 'Assets');
  fs.mkdirSync(assetsDir);
  for (const cat of ASSET_CATEGORIES) {
    fs.mkdirSync(path.join(assetsDir, cat), { recursive: true });
  }
  fs.mkdirSync(path.join(assetsDir, 'Images'), { recursive: true });
  fs.mkdirSync(path.join(assetsDir, 'Images', 'Weapons'), { recursive: true });
  fs.mkdirSync(path.join(assetsDir, 'Images', 'Firemodes'), { recursive: true });
  fs.mkdirSync(path.join(assetsDir, 'Images', 'Ammo'), { recursive: true });

  console.log(`[PROJECT] Created: ${id}`);
  return { status: 'ok', id, name: id };
}

function renameProject(input) {
  const oldId = sanitizeProjectId(input.id);
  const newName = (input.name || '').trim();
  if (!oldId || !newName) throw httpErr(400, 'Missing id or name');

  const newId = sanitizeProjectId(newName);
  if (!newId) throw httpErr(400, 'Invalid project name');

  const oldDir = path.join(DATA_ROOT, oldId);
  const newDir = path.join(DATA_ROOT, newId);

  if (!fs.existsSync(oldDir)) throw httpErr(404, 'Project not found');
  if (oldId !== newId && fs.existsSync(newDir)) throw httpErr(409, 'A project with that name already exists');

  if (oldId !== newId) {
    fs.renameSync(oldDir, newDir);
    console.log(`[PROJECT] Renamed: ${oldId} → ${newId}`);
  }

  return { status: 'ok', id: newId, name: newId };
}

function deleteProject(id) {
  id = sanitizeProjectId(id);
  if (!id) throw httpErr(400, 'Missing id');

  const dir = path.join(DATA_ROOT, id);
  if (!fs.existsSync(dir)) throw httpErr(404, 'Project not found');

  fs.rmSync(dir, { recursive: true, force: true });
  console.log(`[PROJECT] Deleted: ${id}`);
  return { status: 'ok' };
}

function getProjectSettings(id) {
  id = sanitizeProjectId(id);
  const filePath = path.join(DATA_ROOT, id, 'settings.json');
  if (fs.existsSync(filePath)) return readJson(filePath);
  return { bundlePath: 'Bundles/', assemblies: [], steamTags: [], skipManifestExport: false };
}

function saveProjectSettings(input) {
  const id = sanitizeProjectId(input.project);
  if (!id) throw httpErr(400, 'Missing project');
  const dir = path.join(DATA_ROOT, id);
  if (!fs.existsSync(dir)) throw httpErr(404, 'Project not found');
  const settings = {
    bundlePath: input.bundlePath || 'Bundles/',
    assemblies: Array.isArray(input.assemblies) ? input.assemblies : [],
    steamTags: Array.isArray(input.steamTags) ? input.steamTags : [],
    skipManifestExport: !!input.skipManifestExport,
  };
  writeJson(path.join(dir, 'settings.json'), settings);
  console.log(`[PROJECT] Settings saved: ${id}`);
  return { status: 'ok', ...settings };
}

function getProjectTree(id) {
  id = sanitizeProjectId(id);
  const assetsDir = path.join(DATA_ROOT, id, 'Assets');
  if (!fs.existsSync(assetsDir)) throw httpErr(404, 'Project not found');

  const tree = {};
  for (const cat of ASSET_CATEGORIES) {
    const catDir = path.join(assetsDir, cat);
    if (fs.existsSync(catDir)) {
      const files = glob(catDir, '.json').map(f => {
        const data = readJson(f);
        const fileId = path.basename(f, '.json');
        return {
          id: fileId,
          recordType: data.RecordType || '',
          dataId: data.Data?.Id || data.Data?.ItemId || fileId,
        };
      });
      tree[cat] = files;
    } else {
      tree[cat] = [];
    }
  }

  // Look up English names from localization files for weapons
  const locDir = path.join(assetsDir, 'Localization', 'Weapons');
  if (tree['Weapons'] && fs.existsSync(locDir)) {
    for (const w of tree['Weapons']) {
      const locFile = path.join(locDir, `${w.dataId}_localization.json`);
      if (fs.existsSync(locFile)) {
        try {
          const loc = readJson(locFile);
          const nameKey = `item.${w.dataId}.name`;
          w.englishName = loc.Data?.Keys?.[nameKey]?.EnglishUS || '';
        } catch {}
      }
    }
  }

  // Look up English names from localization files for ammo
  const ammoLocDir = path.join(assetsDir, 'Localization', 'Ammo');
  if (tree['Ammo'] && fs.existsSync(ammoLocDir)) {
    for (const a of tree['Ammo']) {
      const locFile = path.join(ammoLocDir, `${a.dataId}_localization.json`);
      if (fs.existsSync(locFile)) {
        try {
          const loc = readJson(locFile);
          const nameKey = `item.${a.dataId}.name`;
          a.englishName = loc.Data?.Keys?.[nameKey]?.EnglishUS || '';
        } catch {}
      }
    }
  }

  return { id, tree };
}

// ═══════════════════════════════════════════════════════════════════
//  ASSETS (generic CRUD across all categories)
// ═══════════════════════════════════════════════════════════════════

function listAssets(projectId, category) {
  projectId = sanitizeProjectId(projectId);
  category = validateCategory(category);

  const catDir = path.join(DATA_ROOT, projectId, 'Assets', category);
  if (!fs.existsSync(catDir)) return { assets: [] };

  const assets = glob(catDir, '.json').map(f => {
    const data = readJson(f);
    const fileId = path.basename(f, '.json');
    return {
      id: fileId,
      recordType: data.RecordType || '',
      dataId: data.Data?.Id || data.Data?.ItemId || fileId,
      data: data.Data || {},
    };
  }).sort((a, b) => a.id.localeCompare(b.id));

  return { project: projectId, category, assets };
}

function getAsset(projectId, category, assetId) {
  projectId = sanitizeProjectId(projectId);
  category = validateCategory(category);
  assetId = sanitizeAssetId(assetId);

  const filePath = path.join(DATA_ROOT, projectId, 'Assets', category, `${assetId}.json`);
  if (!fs.existsSync(filePath)) throw httpErr(404, 'Asset not found');

  return readJson(filePath);
}

function saveAsset(input) {
  const projectId = sanitizeProjectId(input.project);
  const category = validateCategory(input.category);
  const assetId = sanitizeAssetId(input.id || input.data?.Id || input.data?.ItemId);

  if (!projectId) throw httpErr(400, 'Missing project');
  if (!assetId) throw httpErr(400, 'Missing asset id');

  // Ensure category dir exists
  const catDir = path.join(DATA_ROOT, projectId, 'Assets', category);
  if (!fs.existsSync(catDir)) fs.mkdirSync(catDir, { recursive: true });

  // Build the file content in the standard format
  const record = {
    RecordType: input.recordType || input.RecordType || '',
    Data: input.data || input.Data || {},
  };

  const filePath = path.join(catDir, `${assetId}.json`);
  const isNew = !fs.existsSync(filePath);

  writeJson(filePath, record);
  console.log(`[ASSET] ${isNew ? 'Created' : 'Updated'}: ${projectId}/${category}/${assetId}`);

  return { status: 'ok', project: projectId, category, id: assetId, isNew };
}

function deleteAsset(projectId, category, assetId) {
  projectId = sanitizeProjectId(projectId);
  category = validateCategory(category);
  assetId = sanitizeAssetId(assetId);

  const filePath = path.join(DATA_ROOT, projectId, 'Assets', category, `${assetId}.json`);
  if (!fs.existsSync(filePath)) throw httpErr(404, 'Asset not found');

  fs.unlinkSync(filePath);

  // Clean up associated images — scoped to this category's own image folder
  // and its own suffixes, so same-named assets of other types are untouched.
  // Weapons may live in Images/Weapons root or a user subfolder.
  const IMAGE_SCOPE = {
    'Weapons':   { folder: 'Weapons',   suffixes: ['sprite_icon', 'sprite_floor', 'sprite_shadow'], subfolders: true },
    'Ammo':      { folder: 'Ammo',      suffixes: ['sprite_icon', 'sprite_floor', 'sprite_shadow'], subfolders: false },
    'Firemodes': { folder: 'Firemodes', suffixes: ['sprite'], subfolders: false },
  };
  const scope = IMAGE_SCOPE[category];
  if (scope) {
    const imagesDir = path.join(DATA_ROOT, projectId, 'Assets', 'Images');
    const foldersToCheck = [];
    const rootDir = path.join(imagesDir, scope.folder);
    if (fs.existsSync(rootDir)) {
      foldersToCheck.push(scope.folder);
      if (scope.subfolders) {
        fs.readdirSync(rootDir, { withFileTypes: true })
          .filter(d => d.isDirectory()).forEach(d => foldersToCheck.push(scope.folder + '/' + d.name));
      }
    }
    for (const folder of foldersToCheck) {
      const dir = resolveImagesDir(projectId, folder);
      for (const suffix of scope.suffixes) {
        const imgPath = path.join(dir, `${assetId}_${suffix}.png`);
        if (fs.existsSync(imgPath)) {
          fs.unlinkSync(imgPath);
          console.log(`[IMAGE] Cleaned up: ${folder}/${assetId}_${suffix}.png`);
        }
      }
    }
  }

  console.log(`[ASSET] Deleted: ${projectId}/${category}/${assetId}`);
  return { status: 'ok' };
}
// ═══════════════════════════════════════════════════════════════════
//  IMAGES
// ═══════════════════════════════════════════════════════════════════

function validateSuffix(suffix) {
  if (!IMAGE_SUFFIXES.includes(suffix)) {
    throw httpErr(400, `Invalid image suffix: ${suffix}. Valid: ${IMAGE_SUFFIXES.join(', ')}`);
  }
  return suffix;
}

function resolveImagesDir(projectId, folder) {
  const base = path.join(DATA_ROOT, projectId, 'Assets', 'Images');
  if (!folder) return base;
  const clean = folder.trim().replace(/[<>:"\\|?*]/g, '').replace(/\.\./g, '');
  if (!clean) return base;
  return path.join(base, clean);
}

const RESERVED_IMAGE_FOLDERS = ['Ammo', 'Firemodes', 'Weapons'];

function listImageFolders(projectId) {
  projectId = sanitizeProjectId(projectId);
  const weaponsDir = path.join(DATA_ROOT, projectId, 'Assets', 'Images', 'Weapons');
  if (!fs.existsSync(weaponsDir)) return { folders: [] };
  const folders = fs.readdirSync(weaponsDir, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name).sort();
  return { folders };
}

function saveImageFolders(input) {
  const projectId = sanitizeProjectId(input.project);
  if (!projectId) throw httpErr(400, 'Missing project');
  const desired = (input.folders || []).map(f => f.trim().replace(/[<>:"/\\|?*]/g, '').replace(/\.\./g, '')).filter(Boolean);
  const weaponsDir = path.join(DATA_ROOT, projectId, 'Assets', 'Images', 'Weapons');
  if (!fs.existsSync(weaponsDir)) fs.mkdirSync(weaponsDir, { recursive: true });
  const current = fs.readdirSync(weaponsDir, { withFileTypes: true }).filter(d => d.isDirectory()).map(d => d.name);

  // Check for non-empty folders being removed
  const blocked = [];
  for (const f of current) {
    if (!desired.includes(f)) {
      const dir = path.join(weaponsDir, f);
      const contents = fs.readdirSync(dir);
      if (contents.length > 0) blocked.push(f);
    }
  }
  if (blocked.length) {
    throw httpErr(400, `Cannot remove folders that contain images: ${blocked.join(', ')}`);
  }

  // Create new folders
  for (const f of desired) {
    const dir = path.join(weaponsDir, f);
    if (!fs.existsSync(dir)) { fs.mkdirSync(dir, { recursive: true }); console.log(`[IMAGE] Created folder: Images/Weapons/${f}`); }
  }
  // Remove empty folders no longer in list
  for (const f of current) {
    if (!desired.includes(f)) {
      fs.rmdirSync(path.join(weaponsDir, f));
      console.log(`[IMAGE] Removed empty folder: Images/Weapons/${f}`);
    }
  }
  return { status: 'ok', folders: desired };
}

function checkImageFolder(projectId, folder) {
  projectId = sanitizeProjectId(projectId);
  if (!folder) return { empty: true };
  const dir = path.join(DATA_ROOT, projectId, 'Assets', 'Images', 'Weapons', folder);
  if (!fs.existsSync(dir)) return { empty: true };
  const contents = fs.readdirSync(dir);
  return { empty: contents.length === 0, count: contents.length };
}

function findImageFolder(projectId, imageId) {
  projectId = sanitizeProjectId(projectId);
  imageId = sanitizeAssetId(imageId);
  const weaponsDir = path.join(DATA_ROOT, projectId, 'Assets', 'Images', 'Weapons');
  if (!fs.existsSync(weaponsDir)) return { folder: '' };
  // Check Weapons root
  if (fs.existsSync(path.join(weaponsDir, `${imageId}_sprite_icon.png`))) return { folder: '' };
  // Check subfolders
  for (const d of fs.readdirSync(weaponsDir, { withFileTypes: true })) {
    if (d.isDirectory()) {
      if (fs.existsSync(path.join(weaponsDir, d.name, `${imageId}_sprite_icon.png`))) return { folder: d.name };
    }
  }
  return { folder: '' };
}

function moveImages(input) {
  const projectId = sanitizeProjectId(input.project);
  const imageId = sanitizeAssetId(input.id);
  const fromFolder = input.from || '';
  const toFolder = input.to || '';
  if (!projectId || !imageId) throw httpErr(400, 'Missing project or id');
  if (fromFolder === toFolder) return { status: 'ok', moved: [] };
  const fromDir = resolveImagesDir(projectId, fromFolder);
  const toDir = resolveImagesDir(projectId, toFolder);
  if (!fs.existsSync(toDir)) fs.mkdirSync(toDir, { recursive: true });
  const moved = [];
  for (const suffix of IMAGE_SUFFIXES) {
    const oldPath = path.join(fromDir, `${imageId}_${suffix}.png`);
    const newPath = path.join(toDir, `${imageId}_${suffix}.png`);
    if (fs.existsSync(oldPath)) { fs.renameSync(oldPath, newPath); moved.push(suffix); console.log(`[IMAGE] Moved: ${imageId}_${suffix}.png ${fromFolder || 'root'} → ${toFolder || 'root'}`); }
  }
  return { status: 'ok', moved };
}

function uploadImage(input) {
  const projectId = sanitizeProjectId(input.project);
  const imageId = sanitizeAssetId(input.id);
  const suffix = validateSuffix(input.suffix || 'sprite_icon');
  const folder = input.folder || '';
  const base64 = input.data;
  if (!projectId) throw httpErr(400, 'Missing project');
  if (!imageId) throw httpErr(400, 'Missing image id');
  if (!base64) throw httpErr(400, 'Missing image data');
  const raw = base64.replace(/^data:image\/png;base64,/, '');
  const buf = Buffer.from(raw, 'base64');
  if (buf.length < 8 || buf[0] !== 0x89 || buf[1] !== 0x50 || buf[2] !== 0x4E || buf[3] !== 0x47) {
    throw httpErr(400, 'Image must be a PNG file');
  }
  const dir = resolveImagesDir(projectId, folder);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const fileName = `${imageId}_${suffix}.png`;
  fs.writeFileSync(path.join(dir, fileName), buf);
  console.log(`[IMAGE] Uploaded: ${projectId}/Images/${folder ? folder + '/' : ''}${fileName} (${buf.length} bytes)`);
  return { status: 'ok', project: projectId, id: imageId, suffix, folder, file: fileName, size: buf.length };
}

function renameImages(input) {
  const projectId = sanitizeProjectId(input.project);
  const oldId = sanitizeAssetId(input.oldId);
  const newId = sanitizeAssetId(input.newId);
  const folder = input.folder || '';
  if (!projectId || !oldId || !newId) throw httpErr(400, 'Missing project, oldId, or newId');
  if (oldId === newId) return { status: 'ok', renamed: [] };
  const dir = resolveImagesDir(projectId, folder);
  const renamed = [];
  for (const suffix of IMAGE_SUFFIXES) {
    const oldPath = path.join(dir, `${oldId}_${suffix}.png`);
    const newPath = path.join(dir, `${newId}_${suffix}.png`);
    if (fs.existsSync(oldPath)) { fs.renameSync(oldPath, newPath); renamed.push(suffix); console.log(`[IMAGE] Renamed: ${oldId}_${suffix}.png → ${newId}_${suffix}.png`); }
  }
  return { status: 'ok', renamed };
}

function serveImage(res, projectId, imageId, suffix, folder) {
  projectId = sanitizeProjectId(projectId);
  imageId = sanitizeAssetId(imageId);
  suffix = validateSuffix(suffix);
  const fileName = `${imageId}_${suffix}.png`;

  // Try the specified folder first
  const dir = resolveImagesDir(projectId, folder || '');
  let filePath = path.join(dir, fileName);

  // If not found and no explicit folder, scan known locations
  if (!fs.existsSync(filePath) && !folder) {
    const imagesDir = path.join(DATA_ROOT, projectId, 'Assets', 'Images');
    const searchDirs = [];
    for (const reserved of RESERVED_IMAGE_FOLDERS) {
      const resDir = path.join(imagesDir, reserved);
      if (fs.existsSync(resDir)) {
        searchDirs.push(resDir);
        fs.readdirSync(resDir, { withFileTypes: true })
          .filter(d => d.isDirectory()).forEach(d => searchDirs.push(path.join(resDir, d.name)));
      }
    }

    for (const searchDir of searchDirs) {
      const candidate = path.join(searchDir, fileName);
      if (fs.existsSync(candidate)) { filePath = candidate; break; }
    }
  }

  if (!fs.existsSync(filePath)) { res.writeHead(404); res.end('Not found'); return; }
  res.writeHead(200, { 'Content-Type': 'image/png' });
  fs.createReadStream(filePath).pipe(res);
}

// ═══════════════════════════════════════════════════════════════════
//  REFERENCE DATA (TSV files in ref/)
// ═══════════════════════════════════════════════════════════════════

function parseTsv(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const lines = raw.split(/\r?\n/).filter(l => l.trim() && !l.startsWith('#'));

  if (lines.length < 1) return { columns: [], rows: [] };

  // Keep raw positions so cells align; track which indices have named columns
  const rawColumns = lines[0].split('\t').map(c => c.trim());
  const columns = rawColumns.filter(Boolean);
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const cells = lines[i].split('\t').map(c => c.trim());
    const row = {};
    for (let j = 0; j < rawColumns.length; j++) {
      if (rawColumns[j]) {
        row[rawColumns[j]] = cells[j] || '';
      }
    }
    rows.push(row);
  }

  return { columns, rows };
}

function listRefFiles() {
  const result = {};
  for (const folder of ['base', 'enums']) {
    const dir = path.join(REF_ROOT, folder);
    if (fs.existsSync(dir)) {
      result[folder] = fs.readdirSync(dir)
        .filter(f => f.endsWith('.txt'))
        .map(f => f.replace('.txt', ''));
    } else {
      result[folder] = [];
    }
  }
  return result;
}

function getRefData(folder, file) {
  if (!folder || !file) throw httpErr(400, 'Missing folder or file');
  if (!['base', 'enums'].includes(folder)) throw httpErr(400, 'Invalid folder');

  const filePath = path.join(REF_ROOT, folder, `${file}.txt`);
  if (!fs.existsSync(filePath)) throw httpErr(404, `Ref file not found: ${folder}/${file}`);

  return parseTsv(filePath);
}

function getAllRefData() {
  const all = { base: {}, enums: {} };

  for (const folder of ['base', 'enums']) {
    const dir = path.join(REF_ROOT, folder);
    if (!fs.existsSync(dir)) continue;

    for (const file of fs.readdirSync(dir).filter(f => f.endsWith('.txt'))) {
      const name = file.replace('.txt', '');
      all[folder][name] = parseTsv(path.join(dir, file));
    }
  }

  return all;
}

// ═══════════════════════════════════════════════════════════════════
//  REFERENCE DATA UPDATE
// ═══════════════════════════════════════════════════════════════════
const REF_REQUIRED_FILES = ['config_items.txt', 'config_items_properties.txt', 'config_spacesandbox.txt', 'config_wounds.txt'];

// Section → output file mapping
const BASE_SECTION_MAP = {
  // config_items.txt
  'ammo': 'ammo.txt',
  'datadisks': 'datadisks.txt',
  'grenades': 'grenades.txt',
  'pactcomponents': 'pactcomponents.txt',
  'repairs': 'repairs.txt',
  'trash': 'trash.txt',
  // config_items_properties.txt
  'explosions': 'explosions.txt',
  'firemodes': 'firemodes.txt',
  'itemtraits': 'itemTraits.txt',
  'projectiles': 'projectiles.txt',
  // config_spacesandbox.txt
  'factions': 'factions.txt',
  // config_wounds.txt
  'statuseffects': 'statusEffects.txt',
  'damagetypes': 'damageTypes.txt',
};

function extractSection(content, sectionName) {
  const lines = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  const result = [];
  let inside = false;
  for (const line of lines) {
    const trimmed = line.replace(/\t.*/, '').trim().toLowerCase();
    if (trimmed === '#' + sectionName.toLowerCase()) {
      inside = true;
      result.push(line);
      continue;
    }
    if (inside) {
      if (trimmed === '#end') {
        result.push(line);
        break;
      }
      result.push(line);
    }
  }
  return result.length > 1 ? result.join('\n') + '\n' : null;
}

function deriveAmmoTypes(configItemsContent) {
  const section = extractSection(configItemsContent, 'ammo');
  if (!section) return null;
  const lines = section.split('\n').filter(l => l.trim());
  if (lines.length < 3) return null;
  // Column header is line[1]
  const headers = lines[1].split('\t');
  const colIdx = headers.findIndex(h => h.trim().toLowerCase() === 'ammotype');
  if (colIdx < 0) return null;
  const types = new Set();
  for (let i = 2; i < lines.length; i++) {
    if (lines[i].trim().toLowerCase() === '#end') break;
    const val = (lines[i].split('\t')[colIdx] || '').trim();
    if (val) types.add(val);
  }
  const sorted = [...types].filter(Boolean).sort();
  let out = '#ammoTypes\nName\n';
  for (const t of sorted) out += t + '\n';
  out += '\n#end\n';
  return out;
}

function deriveCategories(configItemsContent) {
  const lines = configItemsContent.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  const categories = new Set();
  let inside = false;
  let catColIdx = -1;
  for (const line of lines) {
    const trimmed = line.replace(/\t.*/, '').trim();
    if (trimmed.startsWith('#') && trimmed !== '#end') {
      inside = true;
      catColIdx = -1;
      continue;
    }
    if (trimmed === '#end') { inside = false; continue; }
    if (!inside) continue;
    const cols = line.split('\t');
    if (catColIdx < 0) {
      catColIdx = cols.findIndex(h => h.trim().toLowerCase() === 'categories');
      continue;
    }
    if (catColIdx >= 0 && cols[catColIdx]) {
      const vals = cols[catColIdx].trim().split(/\s+/);
      for (const v of vals) { if (v) categories.add(v); }
    }
  }
  if (!categories.size) return null;
  const sorted = [...categories].sort();
  let out = '#categories\nName\n';
  for (const c of sorted) out += c + '\n';
  out += '#end\n';
  return out;
}

// Parse a ref TSV into { header, key, rows: Map<keyVal, {cells, raw}> }.
// Section files: line0 = #section, line1 = column header, rows keyed by Id
// (leading * stripped). Enum value-lists: line0 = #name, line1 = "Name",
// rows are single values keyed by themselves.
function parseRefTsv(content, isEnum) {
  const out = { header: [], key: isEnum ? 'Name' : 'Id', rows: new Map(), order: [] };
  if (!content) return out;
  const lines = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  let headerIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    const t = lines[i].replace(/\t.*/, '').trim();
    if (t.startsWith('#') || t === '') continue;
    headerIdx = i; break;
  }
  if (headerIdx < 0) return out;
  out.header = lines[headerIdx].split('\t').map(c => c.trim());
  // TSV rows are padded with trailing tabs → drop empty trailing column names
  // so they don't appear in the columns list or generate phantom field diffs.
  while (out.header.length && out.header[out.header.length - 1] === '') out.header.pop();
  const keyCol = isEnum ? 0 : out.header.findIndex(h => h.toLowerCase() === 'id');
  for (let i = headerIdx + 1; i < lines.length; i++) {
    const raw = lines[i];
    const t = raw.trim();
    if (t === '' || t.toLowerCase() === '#end' || t.startsWith('#')) continue;
    const cells = raw.split('\t');
    let keyVal = (cells[keyCol < 0 ? 0 : keyCol] || '').trim().replace(/^\*/, '');
    if (!keyVal) continue;
    out.rows.set(keyVal, cells.map(c => c.trim()));
    out.order.push(keyVal);
  }
  return out;
}

// Compare old vs new ref content; returns { added, removed, modified,
// columnsAdded, columnsRemved } or null when there are no changes.
function diffRefFile(oldContent, newContent, isEnum) {
  const a = parseRefTsv(oldContent, isEnum);
  const b = parseRefTsv(newContent, isEnum);
  const colsA = a.header, colsB = b.header;
  const columnsAdded = colsB.filter(c => !colsA.includes(c));
  const columnsRemoved = colsA.filter(c => !colsB.includes(c));

  const added = [], removed = [], modified = [];
  for (const id of b.order) if (!a.rows.has(id)) added.push(id);
  for (const id of a.order) if (!b.rows.has(id)) removed.push(id);

  // Field-level comparison for entries present in both, matched by column name
  for (const id of b.order) {
    if (!a.rows.has(id)) continue;
    const oldCells = a.rows.get(id), newCells = b.rows.get(id);
    const fields = [];
    const allCols = [...new Set([...colsA, ...colsB])];
    for (const col of allCols) {
      const iA = colsA.indexOf(col), iB = colsB.indexOf(col);
      const ov = iA >= 0 ? (oldCells[iA] ?? '') : null;
      const nv = iB >= 0 ? (newCells[iB] ?? '') : null;
      if (ov !== nv) fields.push({ field: col, old: ov, new: nv });
    }
    if (fields.length) modified.push({ id, fields });
  }

  if (!added.length && !removed.length && !modified.length &&
      !columnsAdded.length && !columnsRemoved.length) return null;
  return { added, removed, modified, columnsAdded, columnsRemoved };
}

async function updateRefData(input) {
  let configs = {};

  if (input.mode === 'files') {
    configs = input.files || {};
  } else if (input.mode === 'path') {
    const folderPath = input.path;
    if (!folderPath || !fs.existsSync(folderPath)) throw httpErr(400, 'Folder not found: ' + folderPath);
    for (const name of REF_REQUIRED_FILES) {
      const fp = path.join(folderPath, name);
      if (fs.existsSync(fp)) {
        configs[name] = fs.readFileSync(fp, 'utf8');
      }
    }
  } else {
    throw httpErr(400, 'Invalid mode');
  }

  const missing = REF_REQUIRED_FILES.filter(f => !configs[f]);
  if (missing.length) throw httpErr(400, 'Missing config files: ' + missing.join(', '));

  const baseDir = path.join(REF_ROOT, 'base');
  const enumsDir = path.join(REF_ROOT, 'enums');
  if (!fs.existsSync(baseDir)) fs.mkdirSync(baseDir, { recursive: true });
  if (!fs.existsSync(enumsDir)) fs.mkdirSync(enumsDir, { recursive: true });

  // Extract all sections to base/
  let extracted = 0;
  const diffs = {};
  for (const [section, filename] of Object.entries(BASE_SECTION_MAP)) {
    // Find which config file contains this section
    let sectionData = null;
    for (const content of Object.values(configs)) {
      sectionData = extractSection(content, section);
      if (sectionData) break;
    }
    if (sectionData) {
      const target = path.join(baseDir, filename);
      const oldContent = fs.existsSync(target) ? fs.readFileSync(target, 'utf8') : '';
      const d = diffRefFile(oldContent, sectionData, false);
      if (d) diffs[filename] = d;
      fs.writeFileSync(target, sectionData, 'utf8');
      extracted++;
    } else {
      console.warn(`[REF_UPDATE] Section #${section} not found in any config file`);
    }
  }

  // Derive mutable enums
  const configItems = configs['config_items.txt'];
  const ammoTypes = deriveAmmoTypes(configItems);
  if (ammoTypes) {
    const target = path.join(enumsDir, 'ammoTypes.txt');
    const oldContent = fs.existsSync(target) ? fs.readFileSync(target, 'utf8') : '';
    const d = diffRefFile(oldContent, ammoTypes, true);
    if (d) diffs['ammoTypes.txt'] = d;
    fs.writeFileSync(target, ammoTypes, 'utf8');
    extracted++;
  }
  const categories = deriveCategories(configItems);
  if (categories) {
    const target = path.join(enumsDir, 'categories.txt');
    const oldContent = fs.existsSync(target) ? fs.readFileSync(target, 'utf8') : '';
    const d = diffRefFile(oldContent, categories, true);
    if (d) diffs['categories.txt'] = d;
    fs.writeFileSync(target, categories, 'utf8');
    extracted++;
  }

  console.log(`[REF_UPDATE] Updated ${extracted} reference files`);
  return { status: 'ok', filesUpdated: extracted, diffs };
}

// ═══════════════════════════════════════════════════════════════════
//  PROJECT EXPORT (ZIP)
// ═══════════════════════════════════════════════════════════════════
const CRC32_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    t[i] = c;
  }
  return t;
})();

function crc32(buf) {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) crc = CRC32_TABLE[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8);
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function buildZip(entries) {
  const locals = [];
  const centralDir = [];
  let offset = 0;

  for (const { name, data } of entries) {
    const nameBuf = Buffer.from(name, 'utf8');
    const crc = crc32(data);
    const local = Buffer.alloc(30 + nameBuf.length);
    local.writeUInt32LE(0x04034B50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0, 6);
    local.writeUInt16LE(0, 8);
    local.writeUInt16LE(0, 10);
    local.writeUInt16LE(0, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(data.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(nameBuf.length, 26);
    local.writeUInt16LE(0, 28);
    nameBuf.copy(local, 30);
    locals.push(local, data);

    const cd = Buffer.alloc(46 + nameBuf.length);
    cd.writeUInt32LE(0x02014B50, 0);
    cd.writeUInt16LE(20, 4);
    cd.writeUInt16LE(20, 6);
    cd.writeUInt16LE(0, 8);
    cd.writeUInt16LE(0, 10);
    cd.writeUInt16LE(0, 12);
    cd.writeUInt16LE(0, 14);
    cd.writeUInt32LE(crc, 16);
    cd.writeUInt32LE(data.length, 20);
    cd.writeUInt32LE(data.length, 24);
    cd.writeUInt16LE(nameBuf.length, 28);
    cd.writeUInt16LE(0, 30);
    cd.writeUInt16LE(0, 32);
    cd.writeUInt16LE(0, 34);
    cd.writeUInt16LE(0, 36);
    cd.writeUInt32LE(0, 38);
    cd.writeUInt32LE(offset, 42);
    nameBuf.copy(cd, 46);
    centralDir.push(cd);

    offset += 30 + nameBuf.length + data.length;
  }

  const cdBuf = Buffer.concat(centralDir);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054B50, 0);
  eocd.writeUInt16LE(0, 4);
  eocd.writeUInt16LE(0, 6);
  eocd.writeUInt16LE(entries.length, 8);
  eocd.writeUInt16LE(entries.length, 10);
  eocd.writeUInt32LE(cdBuf.length, 12);
  eocd.writeUInt32LE(offset, 16);
  eocd.writeUInt16LE(0, 20);

  return Buffer.concat([...locals, cdBuf, eocd]);
}

function collectFiles(dir, base) {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const rel = base ? base + '/' + entry.name : entry.name;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...collectFiles(full, rel));
    } else {
      results.push({ name: rel, data: fs.readFileSync(full) });
    }
  }
  return results;
}

function exportProject(res, id) {
  id = sanitizeProjectId(id);
  if (!id) { res.writeHead(400); res.end('Missing project id'); return; }

  const projDir = path.join(DATA_ROOT, id);
  if (!fs.existsSync(projDir)) { res.writeHead(404); res.end('Project not found'); return; }

  const settings = getProjectSettings(id);
  const entries = [];

  if (!settings.skipManifestExport) {
    const manifest = {
      UniqueModName: id,
      Assemblies: settings.assemblies || [],
      Dependencies: [],
      SteamTags: settings.steamTags || [],
    };
    entries.push({
      name: 'modmanifest.json',
      data: Buffer.from(JSON.stringify(manifest, null, 4), 'utf8')
    });
  }

  const assetsDir = path.join(projDir, 'Assets');
  for (const file of collectFiles(assetsDir, 'Assets')) {
    entries.push(file);
  }

  const zipBuf = buildZip(entries);
  const filename = id + '.zip';

  res.writeHead(200, {
    'Content-Type': 'application/zip',
    'Content-Disposition': `attachment; filename="${filename}"`,
    'Content-Length': zipBuf.length,
  });
  res.end(zipBuf);
  console.log(`[EXPORT] ${id} — ${entries.length} files, ${zipBuf.length} bytes`);
}

// ═══════════════════════════════════════════════════════════════════
//  UTILITIES
// ═══════════════════════════════════════════════════════════════════

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

// Float-coerced fields, scoped by RecordType. The game expects these as
// floats (trailing .0) only within these record types — a future field that
// happens to share a name in another record type stays untouched.
const FLOAT_FIELDS_BY_RECORD_TYPE = {
  'MGSC.WeaponRecord': ['Price', 'Weight'],
  'MGSC.AmmoRecord': ['Price', 'Weight'],
  'MGSC.DatadiskRecord': ['Price', 'Weight'],
  'QM_ImporterAPI.Templates.FactionTemplate': ['Weight', 'Points'],
};

function writeJson(filePath, data) {
  let json = JSON.stringify(data, null, 2);
  // Force .0 on known float fields (per record type) that serialize as integers
  const floatFields = FLOAT_FIELDS_BY_RECORD_TYPE[data?.RecordType] || [];
  for (const field of floatFields) {
    json = json.replace(new RegExp(`("${field}":\\s*)(\\d+)(\\s*[,\\n}])`, 'g'), (m, pre, num, post) => {
      return num.includes('.') ? m : `${pre}${num}.0${post}`;
    });
  }
  fs.writeFileSync(filePath, json, 'utf8');
}

function glob(dir, ext) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter(f => f.endsWith(ext))
    .map(f => path.join(dir, f));
}

/** Project IDs preserve casing and allow spaces (folder names) */
function sanitizeProjectId(str) {
  if (!str) return '';
  return str.trim().replace(/\.\./g, '').replace(/[<>:"/\\|?*]/g, '');
}

/**
 * Asset IDs are the filename stem — letters, numbers, underscores, hyphens only.
 * Mirrors the client-side /^[a-zA-Z0-9_-]+$/ validation: invalid IDs are
 * rejected (empty return → caller 400/404s) rather than silently transformed.
 */
function sanitizeAssetId(str) {
  if (!str) return '';
  const trimmed = str.trim();
  return /^[a-zA-Z0-9_-]+$/.test(trimmed) ? trimmed : '';
}

/** Validate that a category is one of the known ones */
function validateCategory(cat) {
  if (!cat) throw httpErr(400, 'Missing category');
  const match = ASSET_CATEGORIES.find(c => c.toLowerCase() === cat.toLowerCase());
  if (!match) throw httpErr(400, `Unknown category: ${cat}. Valid: ${ASSET_CATEGORIES.join(', ')}`);
  return match; // return the canonical casing
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      try { resolve(JSON.parse(body || '{}')); }
      catch { reject(httpErr(400, 'Invalid JSON')); }
    });
    req.on('error', reject);
  });
}

function json(res, data) {
  if (!res.headersSent) res.writeHead(200);
  res.end(JSON.stringify(data));
}

function httpErr(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}

// ═══════════════════════════════════════════════════════════════════
//  SERVER
// ═══════════════════════════════════════════════════════════════════

const server = http.createServer(async (req, res) => {
  const parsed = new URL(req.url, 'http://localhost');

  // CORS — scoped to the app's own origin (drive-by requests from other
  // sites get no CORS grant; same-origin requests don't need one anyway)
  res.setHeader('Access-Control-Allow-Origin', `http://localhost:${PORT}`);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.writeHead(200); res.end(); return; }

  // API routes
  if (parsed.pathname === '/api') {
    return handleApi(req, res, Object.fromEntries(parsed.searchParams));
  }

  // Static files
  serveStatic(req, res);
});

server.listen(PORT, () => {
  console.log('');
  console.log('  ╔══════════════════════════════════════╗');
  console.log('  ║   Mod Workflow Tool running          ║');
  console.log(`  ║   http://localhost:${PORT}/`.padEnd(41) + '║');
  console.log('  ║   Press Ctrl+C to stop               ║');
  console.log('  ╚══════════════════════════════════════╝');
  console.log('');
});

process.on('SIGINT', () => { console.log('\nShutting down...'); server.close(() => process.exit(0)); setTimeout(() => process.exit(0), 2000); });
process.on('SIGTERM', () => { console.log('\nShutting down...'); server.close(() => process.exit(0)); setTimeout(() => process.exit(0), 2000); });
