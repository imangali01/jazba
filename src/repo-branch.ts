import { execFile } from "node:child_process";
import { promisify } from "node:util";

const run = promisify(execFile);

async function git(cwd: string, args: string[]): Promise<string> {
  const { stdout } = await run("git", args, { cwd, maxBuffer: 16 * 1024 * 1024 });
  return stdout;
}

async function gitOrUndefined(cwd: string, args: string[]): Promise<string | undefined> {
  try {
    return await git(cwd, args);
  } catch {
    return undefined;
  }
}

/** Текущая ветка или `undefined` в состоянии detached HEAD. */
export async function currentBranch(cwd: string): Promise<string | undefined> {
  const name = (await gitOrUndefined(cwd, ["branch", "--show-current"]))?.trim();
  return name || undefined;
}

/** Имена недавних локальных веток (свежие сверху). */
export async function listBranches(cwd: string, limit: number): Promise<string[]> {
  const raw = await gitOrUndefined(cwd, [
    "for-each-ref",
    "--sort=-committerdate",
    `--count=${limit}`,
    "--format=%(refname:short)",
    "refs/heads",
  ]);
  return (raw ?? "").split("\n").map((l) => l.trim()).filter((l) => l !== "");
}

export async function branchExists(cwd: string, name: string): Promise<boolean> {
  return (await gitOrUndefined(cwd, ["rev-parse", "--verify", "--quiet", `refs/heads/${name}`])) !== undefined;
}

/** Есть ли у текущей ветки upstream — без него `git pull` упадёт. */
export async function hasUpstream(cwd: string): Promise<boolean> {
  return (await gitOrUndefined(cwd, ["rev-parse", "--abbrev-ref", "@{u}"])) !== undefined;
}

export async function pull(cwd: string): Promise<string> {
  return git(cwd, ["pull"]);
}

/** `git checkout -b <name>` либо `git checkout <name>`, если ветка уже есть. */
export async function checkoutBranch(cwd: string, name: string, create: boolean): Promise<string> {
  return git(cwd, create ? ["checkout", "-b", name] : ["checkout", name]);
}
