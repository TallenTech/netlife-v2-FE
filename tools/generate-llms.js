#!/usr/bin/env node

import fs from "fs";
import path from "path";

// --- Constants and Regular Expressions ---
const CLEAN_CONTENT_REGEX = {
  comments: /\/\*[\s\S]*?\*\/|\/\/.*$/gm,
  templateLiterals: /`[\s\S]*?`/g,
  strings: /'[^']*'|"[^"]*"/g,
  jsxExpressions: /\{.*?\}/g,
  htmlEntities: {
    quot: /&quot;/g,
    amp: /&amp;/g,
    lt: /&lt;/g,
    gt: /&gt;/g,
    apos: /&apos;/g,
  },
};

const EXTRACTION_REGEX = {
  route: /<Route\s+[^>]*>/g,
  path: /path=["']([^"']+)["']/,
  element: /element=\{<(\w+)[^}]*\/?\s*>\}/,
  helmet: /<Helmet[^>]*?>([\s\S]*?)<\/Helmet>/i,
  helmetTest: /<Helmet[\s\S]*?<\/Helmet>/i,
  title: /<title[^>]*?>\s*(.*?)\s*<\/title>/i,
  description: /<meta\s+name=["']description["']\s+content=["'](.*?)["']/i,
};

// --- Helper Functions ---

/**
 * Removes comments, template literals, and strings from content to simplify regex.
 * @param {string} content - The file content.
 * @returns {string} Cleaned content.
 */
function cleanContent(content) {
  return content
    .replace(CLEAN_CONTENT_REGEX.comments, "")
    .replace(CLEAN_CONTENT_REGEX.templateLiterals, '""')
    .replace(CLEAN_CONTENT_REGEX.strings, '""');
}

/**
 * Cleans extracted text from JSX/HTML, removing expressions and decoding entities.
 * @param {string} text - The text to clean.
 * @returns {string} The cleaned text.
 */
function cleanText(text) {
  if (!text) return text;
  return text
    .replace(CLEAN_CONTENT_REGEX.jsxExpressions, "")
    .replace(CLEAN_CONTENT_REGEX.htmlEntities.quot, '"')
    .replace(CLEAN_CONTENT_REGEX.htmlEntities.amp, "&")
    .replace(CLEAN_CONTENT_REGEX.htmlEntities.lt, "<")
    .replace(CLEAN_CONTENT_REGEX.htmlEntities.gt, ">")
    .replace(CLEAN_CONTENT_REGEX.htmlEntities.apos, "'")
    .trim();
}

/**
 * Extracts route paths and their associated component names from App.jsx.
 * @param {string} appJsxPath - Path to the main App.jsx file.
 * @returns {Map<string, string>} A map of ComponentName -> /route/path.
 */
function extractRoutes(appJsxPath) {
  if (!fs.existsSync(appJsxPath)) return new Map();
  try {
    const content = fs.readFileSync(appJsxPath, "utf8");
    const routes = new Map();
    const routeMatches = [...content.matchAll(EXTRACTION_REGEX.route)];
    for (const match of routeMatches) {
      const routeTag = match[0];
      const pathMatch = routeTag.match(EXTRACTION_REGEX.path);
      const elementMatch = routeTag.match(EXTRACTION_REGEX.element);
      const isIndex = routeTag.includes("index");

      if (elementMatch) {
        const componentName = elementMatch[1];
        let routePath;
        if (isIndex) {
          routePath = "/";
        } else if (pathMatch) {
          routePath = pathMatch[1].startsWith("/")
            ? pathMatch[1]
            : `/${pathMatch[1]}`;
        }
        if (routePath) {
          routes.set(componentName, routePath);
        }
      }
    }
    return routes;
  } catch (error) {
    console.error("⚠️ Could not extract routes:", error.message);
    return new Map();
  }
}

// --- THIS IS THE FIXED FUNCTION ---
/**
 * Recursively finds all React files (.jsx, .js, .tsx, .ts) in a directory.
 * It correctly handles subdirectories and skips ignored folders like '__tests__'.
 * @param {string} dir - The directory to start searching from.
 * @param {string[]} arrayOfFiles - Accumulator for file paths.
 * @returns {string[]} An array of full paths to React files.
 */
function findReactFiles(dir, arrayOfFiles = []) {
  const IGNORED_DIRS = ["__tests__", "node_modules"];
  const ALLOWED_EXTENSIONS = [".jsx", ".js", ".tsx", ".ts"];

  let items;
  try {
    items = fs.readdirSync(dir);
  } catch (err) {
    // If the directory doesn't exist or isn't readable, stop.
    return arrayOfFiles;
  }

  items.forEach((item) => {
    const fullPath = path.join(dir, item);
    if (IGNORED_DIRS.includes(item)) {
      // Skip ignored directories completely
      return;
    }

    try {
      const stats = fs.statSync(fullPath);
      if (stats.isDirectory()) {
        // If it's a directory, recurse into it
        findReactFiles(fullPath, arrayOfFiles);
      } else if (
        stats.isFile() &&
        ALLOWED_EXTENSIONS.includes(path.extname(item))
      ) {
        // If it's a file with an allowed extension, add it to the list
        arrayOfFiles.push(fullPath);
      }
    } catch (err) {
      // Ignore items we can't get stats for
    }
  });

  return arrayOfFiles;
}

/**
 * Extracts Helmet title and description from a file's content.
 * @param {string} content - The file content.
 * @param {string} filePath - The path to the file (for context).
 * @param {Map<string, string>} routes - The map of routes.
 * @returns {object|null} The extracted page data or null if no Helmet found.
 */
function extractHelmetData(content, filePath, routes) {
  const cleanedContent = cleanContent(content);
  if (!EXTRACTION_REGEX.helmetTest.test(cleanedContent)) return null;

  const helmetMatch = content.match(EXTRACTION_REGEX.helmet);
  if (!helmetMatch) return null;

  const helmetContent = helmetMatch[1];
  const titleMatch = helmetContent.match(EXTRACTION_REGEX.title);
  const descMatch = helmetContent.match(EXTRACTION_REGEX.description);

  const title = cleanText(titleMatch?.[1]);
  const description = cleanText(descMatch?.[1]);

  const fileName = path.basename(filePath, path.extname(filePath));
  const url = routes.has(fileName)
    ? routes.get(fileName)
    : generateFallbackUrl(fileName);

  return {
    url,
    title: title || "Untitled Page",
    description: description || "No description available.",
  };
}

function generateFallbackUrl(fileName) {
  const cleanName = fileName.replace(/Page$/, "").toLowerCase();
  return cleanName === "app" ? "/" : `/${cleanName}`;
}

function generateLlmsTxt(pages) {
  const sortedPages = pages.sort((a, b) => a.title.localeCompare(b.title));
  const pageEntries = sortedPages
    .map((page) => `- [${page.title}](${page.url}): ${page.description}`)
    .join("\n");
  return `## Pages\n${pageEntries}`;
}

function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * Reads a single file and extracts its Helmet data.
 * @param {string} filePath - Path to the file to process.
 * @param {Map<string, string>} routes - The map of routes.
 * @returns {object|null} The extracted page data.
 */
function processPageFile(filePath, routes) {
  try {
    const content = fs.readFileSync(filePath, "utf8");
    return extractHelmetData(content, filePath, routes);
  } catch (error) {
    // This error should now only happen on actual read errors, not directory errors.
    console.error(`❌ Error processing file ${filePath}:`, error.message);
    return null;
  }
}

// --- Main Execution Logic ---
function main() {
  console.log("🚀 Starting LLM generation script...");
  const pagesDir = path.join(process.cwd(), "src", "pages");
  const appJsxPath = path.join(process.cwd(), "src", "App.jsx");

  let pages = [];
  const routes = extractRoutes(appJsxPath);

  if (!fs.existsSync(pagesDir)) {
    console.warn(
      '⚠️ "src/pages" directory not found. Only processing App.jsx.'
    );
    const appData = processPageFile(appJsxPath, routes);
    if (appData) pages.push(appData);
  } else {
    // Use the new, safe findReactFiles function
    const reactFiles = findReactFiles(pagesDir);
    pages = reactFiles
      .map((filePath) => processPageFile(filePath, routes))
      .filter(Boolean);
  }

  if (pages.length === 0) {
    console.error("❌ No pages with <Helmet> components were found. Exiting.");
    // Don't create the file if nothing was found.
    // Use process.exit(0) because this may not be a build failure.
    // Change to process.exit(1) if an empty llms.txt should fail the build.
    process.exit(0);
    return;
  }

  const llmsTxtContent = generateLlmsTxt(pages);
  const outputPath = path.join(process.cwd(), "public", "llms.txt");

  ensureDirectoryExists(path.dirname(outputPath));
  fs.writeFileSync(outputPath, llmsTxtContent, "utf8");

  console.log(`✅ Successfully generated llms.txt with ${pages.length} pages.`);
  console.log("🎉 Script finished successfully.");
}

// Check if the script is being run directly.
const isMainModule =
  import.meta.url.startsWith("file:") &&
  process.argv[1] === new URL(import.meta.url).pathname;

if (isMainModule) {
  main();
}
