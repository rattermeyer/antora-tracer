/**
 * Release-consistency checking: validates that package.json, git tags,
 * maintenance branches, CI playbook refs, and the changelog agree on the
 * release version. Pure validation logic plus a git/file reader.
 *
 * This is a self-check utility for the repository, not part of the extension.
 */
import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { load as yamlLoad } from "js-yaml";
function git(args, cwd) {
    try {
        return execSync(`git ${args}`, {
            cwd,
            encoding: "utf8",
            stdio: ["ignore", "pipe", "ignore"],
        }).trim();
    }
    catch {
        return "";
    }
}
/**
 * Read the live repository state from the given working directory.
 */
export function gatherState(cwd) {
    const pkg = JSON.parse(readFileSync(join(cwd, "package.json"), "utf8"));
    const playbook = yamlLoad(readFileSync(join(cwd, "antora-playbook-ci.yml"), "utf8"));
    const refs = [];
    for (const src of playbook.content?.sources ?? []) {
        for (const b of src.branches ?? [])
            refs.push(b);
        for (const t of src.tags ?? [])
            refs.push(t);
    }
    return {
        version: pkg.version,
        branches: git("for-each-ref --format='%(refname:short)' refs/heads/", cwd)
            .split("\n")
            .filter(Boolean),
        tags: git("tag --list", cwd)
            .split("\n")
            .filter(Boolean),
        playbookRefs: refs,
        changelog: readFileSync(join(cwd, "CHANGELOG.md"), "utf8"),
    };
}
/**
 * Validate a release state object. Returns findings (empty array = consistent).
 */
export function checkConsistency(state) {
    const findings = [];
    const { version, branches, tags, playbookRefs, changelog } = state;
    const tag = `v${version}`;
    if (!tags.includes(tag)) {
        findings.push(`missing git tag ${tag} (package.json is ${version})`);
    }
    const [major, minor] = version.split(".").map(Number);
    const maintBranch = `v${major}.${minor}.x`;
    if (!branches.includes(maintBranch)) {
        findings.push(`missing maintenance branch ${maintBranch} for release ${version}`);
    }
    if (!changelog.includes(`## [${version}]`)) {
        findings.push(`missing changelog entry [${version}]`);
    }
    for (const ref of playbookRefs) {
        if (ref === "HEAD")
            continue; // local preview sentinel, not a real ref
        if (!branches.includes(ref) && !tags.includes(ref)) {
            findings.push(`playbook ref '${ref}' does not exist in the repository`);
        }
    }
    return findings;
}
