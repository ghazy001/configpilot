import { lstat, realpath } from "node:fs/promises";
import { resolve, relative, isAbsolute, sep } from "node:path";
import { readConfigFile } from "../utils/read-config-file.js";
import { normalizeRules, object, projectError, safeRelative } from "./rules.js";

export async function containedPath(root, path, directory = false) {
  try {
    const base = await realpath(resolve(root));
    const full = resolve(base, path);
    const rel = relative(base, full);
    if (
      isAbsolute(rel) ||
      rel === ".." ||
      rel.startsWith(`..${sep}`) ||
      (await realpath(full)) !== full
    )
      throw new Error();
    const info = await lstat(full);
    if (
      info.isSymbolicLink() ||
      (directory ? !info.isDirectory() : !info.isFile())
    )
      throw new Error();
    return full;
  } catch {
    throw projectError("PROJECT_PATH_INVALID");
  }
}
export async function loadProjectConfig(root, path) {
  try {
    if (!safeRelative(path, false) || !path.endsWith(".json"))
      throw new Error();
    const file = await containedPath(root, path);
    const data = JSON.parse(
      await readConfigFile(file, { noFollow: true, maxBytes: 65536 }),
    );
    object(data, ["schemaVersion", "rules", "workspaces"]);
    if (data.schemaVersion !== 1) throw new Error();
    const rules = normalizeRules(data.rules);
    const workspaces = data.workspaces === undefined ? [] : data.workspaces;
    if (!Array.isArray(workspaces) || workspaces.length > 16) throw new Error();
    const names = new Set(),
      roots = [];
    for (const w of workspaces) {
      object(w, ["name", "root", "path", "template", "environment", "rules"]);
      if (
        typeof w.name !== "string" ||
        !/^[A-Za-z0-9][A-Za-z0-9_-]{0,31}$/.test(w.name) ||
        names.has(w.name) ||
        !safeRelative(w.root)
      )
        throw new Error();
      names.add(w.name);
      for (const k of ["path", "template", "environment"])
        if (w[k] !== undefined && !safeRelative(w[k])) throw new Error();
      // Resolve selected roots later. Unselected workspaces cause no file reads.
      const normalized = w.root
        .split("/")
        .filter((s) => s !== ".")
        .join("/");
      if (
        roots.some(
          (r) =>
            r === normalized ||
            !r ||
            !normalized ||
            r.startsWith(normalized + "/") ||
            normalized.startsWith(r + "/"),
        )
      )
        throw new Error();
      roots.push(normalized);
      if (w.rules !== undefined) normalizeRules(w.rules);
      w.rules = normalizeRules({
        ...rules,
        ...w.rules,
        severity: { ...rules.severity, ...w.rules?.severity },
      });
    }
    return {
      rules,
      workspaces: workspaces.sort((a, b) =>
        a.name < b.name ? -1 : a.name > b.name ? 1 : 0,
      ),
    };
  } catch {
    throw projectError();
  }
}
