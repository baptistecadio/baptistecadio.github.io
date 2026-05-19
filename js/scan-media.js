/**
 * scan-media.js
 *
 * Pour chaque projet dans projects.json qui possède un champ "mediaFolder",
 * liste tous les fichiers images/vidéos du dossier et met à jour "media".
 *
 * Convention des chemins :
 *   "mediaFolder": "../images/racc/"
 *   → relatif aux pages HTML (dossier pages/)
 *   → depuis la racine du projet : images/racc/
 *
 * Usage :
 *   node js/scan-media.js           → scan unique
 *   node js/scan-media.js --watch   → surveille les dossiers et met à jour automatiquement
 */

const fs   = require("fs");
const path = require("path");

const MEDIA_EXTENSIONS = new Set([
  ".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg", ".avif",
  ".mp4", ".webm", ".ogg", ".mov",
]);

const JSON_PATH = path.join(__dirname, "projects.json");
const PAGES_DIR = path.join(__dirname, "..", "pages");
const WATCH_MODE = process.argv.includes("--watch");

// ─── Lecture & scan ─────────────────────────────────────────────────────────

function readProjects() {
  return JSON.parse(fs.readFileSync(JSON_PATH, "utf-8"));
}

function scanFolder(project) {
  const absFolder = path.resolve(PAGES_DIR, project.mediaFolder);

  if (!fs.existsSync(absFolder)) {
    console.warn(`  [WARN] Dossier introuvable : ${absFolder}  (projet: ${project.id})`);
    return false;
  }

  const files = fs.readdirSync(absFolder)
    .filter((f) => MEDIA_EXTENSIONS.has(path.extname(f).toLowerCase()))
    .sort();

  if (files.length === 0) {
    console.warn(`  [WARN] Aucun média trouvé dans : ${absFolder}  (projet: ${project.id})`);
    return false;
  }

  const folderBase = project.mediaFolder.replace(/\/$/, "");
  project.media = files.map((f) => `${folderBase}/${f}`);
  console.log(`  [OK]   ${project.id} → ${files.length} fichier(s) depuis ${project.mediaFolder}`);
  return true;
}

function runScan() {
  const projects = readProjects();
  let updated = 0;

  projects.forEach((project) => {
    if (!project.mediaFolder) return;
    if (scanFolder(project, projects)) updated++;
  });

  fs.writeFileSync(JSON_PATH, JSON.stringify(projects, null, 4), "utf-8");
  const now = new Date().toLocaleTimeString("fr-FR");
  console.log(`\n✓ [${now}] projects.json mis à jour (${updated} projet(s) traité(s))\n`);
}

// ─── Mode watch ─────────────────────────────────────────────────────────────

function startWatch() {
  let chokidar;
  try {
    chokidar = require("chokidar");
  } catch (e) {
    console.error("chokidar non trouvé. Installe-le avec : npm install --save-dev chokidar");
    process.exit(1);
  }

  // Collecter tous les dossiers surveillés
  const projects = readProjects();
  const foldersToWatch = [];

  projects.forEach((project) => {
    if (!project.mediaFolder) return;
    const absFolder = path.resolve(PAGES_DIR, project.mediaFolder);
    if (fs.existsSync(absFolder)) {
      foldersToWatch.push(absFolder);
    }
  });

  if (foldersToWatch.length === 0) {
    console.warn("Aucun dossier à surveiller.");
    return;
  }

  console.log(`\n👁  Mode watch actif — surveillance de ${foldersToWatch.length} dossier(s):`);
  foldersToWatch.forEach((f) => console.log(`   • ${f}`));
  console.log("\nAjoute ou supprime des images dans ces dossiers pour mettre à jour projects.json automatiquement.\n");

  // Scan initial
  runScan();

  // Watcher
  let debounceTimer;
  chokidar.watch(foldersToWatch, { ignoreInitial: true }).on("all", (event, filePath) => {
    const ext = path.extname(filePath).toLowerCase();
    if (!MEDIA_EXTENSIONS.has(ext)) return;

    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      console.log(`  [CHANGE] ${event}: ${path.basename(filePath)}`);
      runScan();
    }, 300);
  });
}

// ─── Point d'entrée ─────────────────────────────────────────────────────────

if (WATCH_MODE) {
  startWatch();
} else {
  runScan();
}
