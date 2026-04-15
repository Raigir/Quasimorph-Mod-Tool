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
  let filePath = path.join(__dirname, req.url === '/' ? 'index.html' : req.url.split('?')[0]);
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

      // ── Datadisks ──────────────────────────────────────────
      case 'datadisk_membership':
        return json(res, getDatadiskMembership(query.project, query.id));

      case 'datadisk_update':
        return json(res, updateDatadiskMembership(await readBody(req)));

      case 'datadisk_rename_weapon':
        return json(res, renameWeaponInDatadisks(await readBody(req)));

      case 'datadisk_remove_weapon':
        return json(res, removeWeaponFromAllDatadisks(await readBody(req)));

      case 'health':
        return json(res, { status: 'ok', timestamp: Date.now() });

      // ── Reference Data ─────────────────────────────────────
      case 'ref_list':
        return json(res, listRefFiles());

      case 'ref':
        return json(res, getRefData(query.folder, query.file));

      case 'ref_all':
        return json(res, getAllRefData());

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

  // Clean up all associated images (reserved folders + Weapons subfolders)
  const imagesDir = path.join(DATA_ROOT, projectId, 'Assets', 'Images');
  const foldersToCheck = [];
  for (const reserved of RESERVED_IMAGE_FOLDERS) {
    const resDir = path.join(imagesDir, reserved);
    if (fs.existsSync(resDir)) {
      foldersToCheck.push(reserved);
      fs.readdirSync(resDir, { withFileTypes: true })
        .filter(d => d.isDirectory()).forEach(d => foldersToCheck.push(reserved + '/' + d.name));
    }
  }
  for (const folder of foldersToCheck) {
    const dir = resolveImagesDir(projectId, folder);
    for (const suffix of IMAGE_SUFFIXES) {
      const imgPath = path.join(dir, `${assetId}_${suffix}.png`);
      if (fs.existsSync(imgPath)) {
        fs.unlinkSync(imgPath);
        console.log(`[IMAGE] Cleaned up: ${folder ? folder + '/' : ''}${assetId}_${suffix}.png`);
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

// Fields the game expects as floats (integer values need trailing .0)
const FLOAT_FIELDS = ['Price', 'Weight', 'Points'];

function writeJson(filePath, data) {
  let json = JSON.stringify(data, null, 2);
  // Force .0 on known float fields that serialize as integers
  for (const field of FLOAT_FIELDS) {
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
  return str.trim().replace(/[<>:"/\\|?*]/g, '');
}

/** Asset IDs are the filename stem — allow underscores, hyphens, alphanumeric */
function sanitizeAssetId(str) {
  if (!str) return '';
  return str.trim().replace(/[^a-zA-Z0-9_\-]/g, '');
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

  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
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
  console.log('  ║      Mod Workflow Tool running        ║');
  console.log(`  ║   http://localhost:${PORT}/              ║`);
  console.log('  ║   Press Ctrl+C to stop               ║');
  console.log('  ╚══════════════════════════════════════╝');
  console.log('');
});

process.on('SIGINT', () => { console.log('\nShutting down...'); server.close(() => process.exit(0)); setTimeout(() => process.exit(0), 2000); });
process.on('SIGTERM', () => { console.log('\nShutting down...'); server.close(() => process.exit(0)); setTimeout(() => process.exit(0), 2000); });
