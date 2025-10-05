import { execute } from "../runners";
import { log } from "./logger";
import { join } from "./path";
import { readdir } from "fs/promises";

const gitPrereq = {
  command: "git --version && git config --global user.name && git config --global user.email",
  recover: [
    "brew install git",
    "git config --global user.name '$(whoami)'",
    "git config --global user.email '$(whoami)@localhost'"
  ]
};

export const initGitRepository = async (projectDir: string, gitDomain: string) => {
  log({ level: 1, color: "BLUE" }, "\nInitializing git repository...");
  
  const projectName = projectDir.split('/').pop();
  const remoteUrl = `${gitDomain.replace(/\.git$/, '')}/${projectName}.git`;
  
  await execute(
    {
      command: [
        `git ls-remote ${remoteUrl}`,
        `gh repo create ${projectName} --private --confirm`,
        "git init",
        "git add .",
        'git commit -m "Initial commit"',
        `git remote add origin ${remoteUrl}`
      ],
      dir: projectDir,
      prereq: gitPrereq,
      options: { resolveOnErrorCode: true }
    },
    "git"
  );
};



export const deleteAppRepositories = async (appName: string, gitDomain?: string) => {
  if (!gitDomain) {
    throw new Error("Git domain is required to delete remote repositories");
  }

  log({ level: 1, color: "BLUE" }, `\nDeleting repositories for app: ${appName}`);
  
  const repositories = [`${appName}_umbrella`, `${appName}_lib`, `${appName}_ui`, `${appName}_web`];
  const deleteCommands = repositories.map(repoName => `gh repo delete ${repoName} --yes`);

  await execute(
    { 
      command: deleteCommands, 
      dir: "/tmp",
      options: { resolveOnErrorCode: true }
    },
    "deleteAppRepositories"
  );
};

export const addGitSubmodules = async (projectDir: string, appsDir: string, gitDomain: string) => {
  log({ level: 1, color: "BLUE" }, "\nSetting up git submodules...");
  
  try {
    const directories = (await readdir(appsDir, { withFileTypes: true }))
      .filter(entry => entry.isDirectory())
      .map(entry => entry.name);

    const projectName = projectDir.split('/').pop()?.replace('_umbrella', '') || '';
    
    const repoCreationCommands = directories.map(dir => {
      const repoName = dir === projectName ? `${projectName}_lib` : dir;
      return `gh repo create ${repoName} --private --confirm`;
    });
    
    await execute(
      {
        command: repoCreationCommands,
        dir: "/tmp",
        options: { resolveOnErrorCode: true }
      },
      "git"
    );

    const appInitCommands = directories.flatMap(dir => {
      const repoName = dir === projectName ? `${projectName}_lib` : dir;
      const submoduleUrl = `${gitDomain.replace(/\.git$/, '')}/${repoName}.git`;
      const appPath = join(appsDir, dir);
      
      return [
        `cd ${appPath} && rm -rf .git`,
        `cd ${appPath} && git init`,
        `cd ${appPath} && git remote add origin ${submoduleUrl}`,
        `cd ${appPath} && git add .`,
        `cd ${appPath} && git commit -m "Initial commit"`,
        `cd ${appPath} && git push -u origin main`
      ];
    });
    
    await execute(
      {
        command: appInitCommands,
        dir: "/tmp",
        prereq: gitPrereq,
        options: { resolveOnErrorCode: true }
      },
      "git"
    );

    const submoduleCommands = [
      ...directories.map(dir => `git rm -r --cached apps/${dir}`),
      ...directories.map(dir => {
        const repoName = dir === projectName ? `${projectName}_lib` : dir;
        const submoduleUrl = `${gitDomain.replace(/\.git$/, '')}/${repoName}.git`;
        return `git submodule add ${submoduleUrl} apps/${dir}`;
      }),
      'git commit -m "Add app submodules"',
      "git push -u origin main"
    ];
    
    await execute(
      {
        command: submoduleCommands,
        dir: projectDir,
        options: { resolveOnErrorCode: true }
      },
      "git"
    );

  } catch (error) {
    log({ level: 1, color: "RED" }, "Error setting up submodules:", error);
    throw error;
  }
};
