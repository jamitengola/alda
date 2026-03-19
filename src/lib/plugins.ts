/**
 * ALDA Plugin System
 *
 * Plugins are declarative JSON files in data/plugins/ that register:
 * - Custom quick-actions in the Spotlight
 * - Custom widgets on the Dashboard
 * - Custom API-powered tools
 *
 * Plugin format (data/plugins/<name>.json):
 * {
 *   "name": "My Plugin",
 *   "description": "What it does",
 *   "icon": "lucide-icon-name",
 *   "version": "1.0.0",
 *   "actions": [
 *     {
 *       "id": "unique-action-id",
 *       "label": "Action Label",
 *       "description": "Description",
 *       "type": "prompt" | "url" | "route",
 *       "value": "prompt text | https://... | /route",
 *       "icon": "lucide-icon-name"
 *     }
 *   ]
 * }
 */

import fs from "node:fs";
import path from "node:path";

export interface PluginAction {
  id: string;
  label: string;
  description: string;
  type: "prompt" | "url" | "route";
  value: string;
  icon?: string;
}

export interface Plugin {
  name: string;
  description: string;
  icon: string;
  version: string;
  actions: PluginAction[];
  /** Resolved from filename */
  slug: string;
}

const PLUGINS_DIR = path.join(process.cwd(), "data", "plugins");

function ensurePluginsDir() {
  if (!fs.existsSync(PLUGINS_DIR)) {
    fs.mkdirSync(PLUGINS_DIR, { recursive: true });
  }
}

export function listPlugins(): Plugin[] {
  ensurePluginsDir();
  const files = fs.readdirSync(PLUGINS_DIR).filter((f) => f.endsWith(".json"));
  const plugins: Plugin[] = [];

  for (const file of files) {
    try {
      const raw = fs.readFileSync(path.join(PLUGINS_DIR, file), "utf-8");
      const data = JSON.parse(raw);
      if (data.name && Array.isArray(data.actions)) {
        plugins.push({
          name: data.name,
          description: data.description || "",
          icon: data.icon || "Puzzle",
          version: data.version || "1.0.0",
          actions: data.actions,
          slug: file.replace(/\.json$/, ""),
        });
      }
    } catch {
      // Skip malformed plugin files
    }
  }

  return plugins;
}

export function getPlugin(slug: string): Plugin | null {
  ensurePluginsDir();
  const filePath = path.join(PLUGINS_DIR, `${slug}.json`);
  if (!fs.existsSync(filePath)) return null;

  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    const data = JSON.parse(raw);
    return {
      name: data.name,
      description: data.description || "",
      icon: data.icon || "Puzzle",
      version: data.version || "1.0.0",
      actions: data.actions || [],
      slug,
    };
  } catch {
    return null;
  }
}

export function savePlugin(slug: string, plugin: Omit<Plugin, "slug">): void {
  ensurePluginsDir();
  const safeName = slug.replace(/[^a-z0-9_-]/gi, "");
  const filePath = path.join(PLUGINS_DIR, `${safeName}.json`);
  fs.writeFileSync(filePath, JSON.stringify(plugin, null, 2), "utf-8");
}

export function deletePlugin(slug: string): boolean {
  ensurePluginsDir();
  const safeName = slug.replace(/[^a-z0-9_-]/gi, "");
  const filePath = path.join(PLUGINS_DIR, `${safeName}.json`);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    return true;
  }
  return false;
}
