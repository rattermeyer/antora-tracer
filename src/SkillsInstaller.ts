import {
  cpSync,
  existsSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  renameSync,
  rmSync,
} from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";

export const harnessNames = ["pi", "claude", "codex"] as const;
export type HarnessName = (typeof harnessNames)[number];
export type SkillInstallStatus =
  | "installed"
  | "replaced"
  | "skipped"
  | "would-install"
  | "would-replace"
  | "failed";

export interface SkillInstallResult {
  name: string;
  status: SkillInstallStatus;
  error?: string;
}

export interface HarnessInstallResult {
  harness: HarnessName;
  destination: string;
  skills: SkillInstallResult[];
  error?: string;
}

interface InstallOptions {
  source: string;
  harnesses: HarnessName[];
  home?: string;
  dryRun?: boolean;
  overwrite?: boolean;
  interactive?: boolean;
  confirmOverwrite?: (
    harness: HarnessName,
    skill: string,
    destination: string,
  ) => boolean | Promise<boolean>;
}

const harnessPaths: Record<HarnessName, string> = {
  pi: ".agents/skills",
  claude: ".claude/skills",
  codex: ".codex/skills",
};

export function parseHarnessNames(names: string[]): HarnessName[] {
  const selected = new Set<HarnessName>();
  for (const raw of names) {
    const name = raw.toLowerCase();
    if (!harnessNames.includes(name as HarnessName)) {
      throw new Error(
        `Unsupported harness '${raw}'. Supported harnesses: ${harnessNames.join(", ")}`,
      );
    }
    selected.add(name as HarnessName);
  }
  return [...selected];
}

export function parseHarnessSelection(
  input: string,
  harnesses: readonly HarnessName[],
): HarnessName[] {
  const value = input.trim();
  if (!value) return [];
  if (value.toLowerCase() === "all") return [...harnesses];

  const indexes = value.split(",").map((part) => part.trim());
  if (indexes.some((part) => !/^\d+$/.test(part))) {
    throw new Error(
      `Choose numbers from 1 to ${harnesses.length}, separated by commas, or enter 'all'.`,
    );
  }
  const selected = new Set<HarnessName>();
  for (const part of indexes) {
    const index = Number(part) - 1;
    const harness = harnesses[index];
    if (!harness) {
      throw new Error(
        `Choose numbers from 1 to ${harnesses.length}, separated by commas, or enter 'all'.`,
      );
    }
    selected.add(harness);
  }
  return [...selected];
}

export async function selectHarnesses(
  prompt: (text: string) => Promise<string>,
  isInteractive: boolean,
  destinationExists: (harness: HarnessName) => boolean,
  showPrompt = true,
): Promise<HarnessName[]> {
  if (!isInteractive) {
    throw new Error(
      `Specify one or more harnesses: ${harnessNames.join(", ")}`,
    );
  }
  if (showPrompt) {
    console.log(
      "Select harnesses to install (comma-separated numbers, 'all', or blank to cancel):",
    );
    harnessNames.forEach((name, index) => {
      const exists = destinationExists(name) ? " (destination exists)" : "";
      const packageAlternative =
        name === "pi" ? " (Pi package install already auto-loads skills)" : "";
      console.log(`  ${index + 1}. ${name}${exists}${packageAlternative}`);
    });
  }
  return parseHarnessSelection(
    await prompt(showPrompt ? "Harnesses: " : ""),
    harnessNames,
  );
}

export function harnessDestination(
  harness: HarnessName,
  home = process.env.HOME || homedir(),
): string {
  return resolve(home, harnessPaths[harness]);
}

export function bundledSkillNames(source: string): string[] {
  try {
    return readdirSync(source, { withFileTypes: true })
      .filter(
        (entry) =>
          entry.isDirectory() &&
          existsSync(join(source, entry.name, "SKILL.md")),
      )
      .map((entry) => entry.name)
      .sort();
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new Error(`Could not read bundled skills from ${source}: ${detail}`);
  }
}

function pathExists(path: string): boolean {
  try {
    lstatSync(path);
    return true;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return false;
    throw error;
  }
}

function errorText(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function failHarness(
  harness: HarnessName,
  destination: string,
  skills: string[],
  error: unknown,
): HarnessInstallResult {
  const message = error instanceof Error ? error.message : String(error);
  return {
    harness,
    destination,
    error: message,
    skills: skills.map((name) => ({ name, status: "failed", error: message })),
  };
}

async function installOneSkill(
  sourcePath: string,
  destinationPath: string,
  harness: HarnessName,
  skill: string,
  options: InstallOptions,
): Promise<SkillInstallResult> {
  const exists = pathExists(destinationPath);
  if (options.dryRun) {
    return {
      name: skill,
      status: exists
        ? options.overwrite
          ? "would-replace"
          : "skipped"
        : "would-install",
    };
  }
  if (exists && !options.overwrite) {
    if (!options.interactive || !options.confirmOverwrite) {
      return { name: skill, status: "skipped" };
    }
    const approved = await options.confirmOverwrite(
      harness,
      skill,
      destinationPath,
    );
    if (!approved) return { name: skill, status: "skipped" };
  }

  const staging = mkdtempSync(
    join(dirname(destinationPath), ".antora-tracer-skill-"),
  );
  const stagedSkill = join(staging, skill);
  const backup = join(staging, "previous");
  let movedPrevious = false;
  try {
    cpSync(sourcePath, stagedSkill, { recursive: true, errorOnExist: true });
    if (exists) {
      renameSync(destinationPath, backup);
      movedPrevious = true;
    }
    try {
      renameSync(stagedSkill, destinationPath);
    } catch (error) {
      if (movedPrevious) renameSync(backup, destinationPath);
      throw error;
    }
    return { name: skill, status: exists ? "replaced" : "installed" };
  } finally {
    rmSync(staging, { recursive: true, force: true });
  }
}

export async function installSkills(
  options: InstallOptions,
): Promise<HarnessInstallResult[]> {
  const home = options.home ?? process.env.HOME ?? homedir();
  const results: HarnessInstallResult[] = [];
  let names: string[];
  try {
    names = bundledSkillNames(options.source);
  } catch (error) {
    const message = errorText(error);
    return options.harnesses.map((harness) => ({
      harness,
      destination: harnessDestination(harness, home),
      skills: [],
      error: message,
    }));
  }

  for (const harness of options.harnesses) {
    const destination = harnessDestination(harness, home);
    if (names.length === 0) {
      results.push({
        harness,
        destination,
        skills: [],
        error: `No bundled skills found in ${options.source}`,
      });
      continue;
    }
    try {
      if (!options.dryRun) mkdirSync(destination, { recursive: true });
      const skills: SkillInstallResult[] = [];
      for (const name of names) {
        try {
          skills.push(
            await installOneSkill(
              join(options.source, name),
              join(destination, name),
              harness,
              name,
              options,
            ),
          );
        } catch (error) {
          skills.push({ name, status: "failed", error: errorText(error) });
        }
      }
      results.push({ harness, destination, skills });
    } catch (error) {
      results.push(failHarness(harness, destination, names, error));
    }
  }

  return results;
}
