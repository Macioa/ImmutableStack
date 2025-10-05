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

export const initGitRepository = async (projectDir: string, gitDomain?: string) => {
  log({ level: 1, color: "BLUE" }, "\nInitializing git repository...");
  
  const projectName = projectDir.split('/').pop();
  const remoteUrl = gitDomain ? `${gitDomain.replace(/\.git$/, '')}/${projectName}.git` : undefined;
  
  if (gitDomain && remoteUrl) {
    const remoteExists = await checkRemoteRepository(remoteUrl);
    if (!remoteExists) {
      try {
        await createRemoteRepository(remoteUrl);
        log({ level: 1, color: "GREEN" }, `Repository created: ${projectName}`);
      } catch (createError) {
        log({ level: 1, color: "RED" }, `Failed to create repository: ${projectName}`);
        throw createError;
      }
    }
  }
  
  const parentCommands = [
    "git init",
    "git add .",
    'git commit -m "Initial commit"'
  ];
  
  if (gitDomain && remoteUrl) {
    parentCommands.push(`git remote add origin ${remoteUrl}`);
  }
  
  await execute(
    {
      command: parentCommands,
      dir: projectDir,
      prereq: gitPrereq
    },
    "git"
  );
  
  if (gitDomain && remoteUrl) {
    log({ level: 1, color: "GREEN" }, `Added remote origin: ${remoteUrl}`);
  }
};

const checkRemoteRepository = async (repoUrl: string): Promise<boolean> => {
  try {
    await execute(
      {
        command: `git ls-remote ${repoUrl}`,
        dir: "/tmp",
      },
      "git"
    );
    return true;
  } catch (error) {
    return false;
  }
};

const createRemoteRepository = async (repoUrl: string): Promise<void> => {
  try {
    const urlMatch = repoUrl.match(/^(https?:\/\/[^\/]+)\/([^\/]+)\/([^\/]+)\.git$/);
    if (!urlMatch) {
      throw new Error(`Invalid repository URL format: ${repoUrl}`);
    }
    
    const [, baseUrl, username, repoName] = urlMatch;
    
    await execute(
      {
        command: `gh repo create ${username}/${repoName} --public --confirm`,
        dir: "/tmp",
        prereq: {
          command: "gh --version && gh auth status",
          recover: [
            "brew install gh",
            "gh auth login --web"
          ]
        }
      },
      "git"
    );
    
  } catch (error) {
    throw new Error(`Cannot create repository automatically. Please create it manually and try again.`);
  }
};


export const deleteAppRepositories = async (appName: string, gitDomain?: string) => {
  if (!gitDomain) {
    throw new Error("Git domain is required to delete remote repositories");
  }

  log({ level: 1, color: "BLUE" }, `\nDeleting repositories for app: ${appName}`);
  
  const baseUrl = gitDomain.replace(/\.git$/, '');
  const repositories = [
    `${appName}_umbrella`,
    `${appName}_lib`, 
    `${appName}_ui`,
    `${appName}_web`
  ];

  for (const repoName of repositories) {
    const repoUrl = `${baseUrl}/${repoName}.git`;
    
    const exists = await checkRemoteRepository(repoUrl);
    if (exists) {
      try {
        await execute(
          {
            command: `gh repo delete ${repoName} --yes`,
            dir: "/tmp",
          },
          "deleteAppRepositories"
        );
        log({ level: 1, color: "GREEN" }, `Deleted repository: ${repoName}`);
      } catch (error) {
        log({ level: 1, color: "RED" }, `Failed to delete repository: ${repoName}`);
        throw error;
      }
    } else {
      log({ level: 1, color: "YELLOW" }, `Repository does not exist: ${repoName}`);
    }
  }
  
  log({ level: 1, color: "GREEN" }, `Repository deletion completed for app: ${appName}`);
};

export const addGitSubmodules = async (projectDir: string, appsDir: string, gitDomain?: string) => {
  log({ level: 1, color: "BLUE" }, "\nSetting up git submodules...");
  
  try {
    const entries = await readdir(appsDir, { withFileTypes: true });
    const directories = entries
      .filter(entry => entry.isDirectory())
      .map(entry => entry.name);

    const submoduleConfigs = await Promise.all(directories.map(async (dir) => {
      let submoduleUrl;
      let remoteExists = false;
      
      if (gitDomain) {
        const projectName = projectDir.split('/').pop()?.replace('_umbrella', '') || '';
        const repoName = dir === projectName ? `${projectName}_lib` : dir;
        submoduleUrl = `${gitDomain.replace(/\.git$/, '')}/${repoName}.git`;
        
        remoteExists = await checkRemoteRepository(submoduleUrl);
        if (!remoteExists) {
          try {
            await createRemoteRepository(submoduleUrl);
            remoteExists = true;
            log({ level: 1, color: "GREEN" }, `Repository created: ${repoName}`);
          } catch (createError) {
            log({ level: 1, color: "RED" }, `Failed to create repository: ${repoName}`);
            throw createError;
          }
        }
      } else {
        submoduleUrl = `./${dir}`;
      }
      
      return { dir, submoduleUrl, remoteExists };
    }));

    for (const { dir, submoduleUrl, remoteExists } of submoduleConfigs) {
      const appPath = join(appsDir, dir);
      
      const submoduleCommands = [
        "rm -rf .git"
      ];
      
      if (gitDomain && remoteExists) {
        submoduleCommands.push(
          "git init",
          `git remote add origin ${submoduleUrl}`,
          "git add .",
          'git commit -m "Initial commit"',
          "git push -u origin master"
        );
      }
      
      await execute(
        {
          command: submoduleCommands,
          dir: appPath,
          prereq: gitPrereq
        },
        "git"
      );
      
      if (gitDomain && remoteExists) {
        log({ level: 1, color: "GREEN" }, `Pushed ${dir} content to remote repository`);
      }

      try {
        await execute(
          {
            command: `git rm -r --cached apps/${dir}`,
            dir: projectDir,
          },
          "git"
        );
      } catch (error) {
        log({ level: 2, color: "YELLOW" }, `Directory apps/${dir} not in git index, continuing...`);
      }

      await execute(
        {
          command: `git submodule add ${submoduleUrl} apps/${dir}`,
          dir: projectDir,
        },
        "git"
      );

      log({ level: 1, color: "GREEN" }, `Added submodule: apps/${dir} -> ${submoduleUrl}`);
    }

    const parentCommands = ['git commit -m "Add app submodules"'];
    if (gitDomain) {
      parentCommands.push("git push -u origin master");
    }
    
    await execute(
      {
        command: parentCommands,
        dir: projectDir,
      },
      "git"
    );
    
    if (gitDomain) {
      log({ level: 1, color: "GREEN" }, `Pushed umbrella repository with submodules`);
    }

  } catch (error) {
    log({ level: 1, color: "RED" }, "Error setting up submodules:", error);
    throw error;
  }
};
