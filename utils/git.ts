import { execute } from "../runners";
import { log } from "./logger";
import { join } from "./path";
import { readdir } from "fs/promises";

export const initGitRepository = async (projectDir: string, gitDomain?: string) => {
  log({ level: 1, color: "BLUE" }, "\nInitializing git repository...");
  
  // Initialize git repo in parent directory
  await execute(
    {
      command: "git init",
      dir: projectDir,
    },
    "initGitRepository"
  );

  // Add initial commit
  await execute(
    {
      command: "git add .",
      dir: projectDir,
    },
    "initGitRepository"
  );

  await execute(
    {
      command: 'git commit -m "Initial commit"',
      dir: projectDir,
    },
    "initGitRepository"
  );

  // Add remote if git domain provided
  if (gitDomain) {
    const projectName = projectDir.split('/').pop();
    // Construct parent repository URL by appending project name
    const baseUrl = gitDomain.replace(/\.git$/, '');
    const remoteUrl = `${baseUrl}/${projectName}.git`;
    
    // Check if remote repository exists, create if needed
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
    
    await execute(
      {
        command: `git remote add origin ${remoteUrl}`,
        dir: projectDir,
      },
      "initGitRepository"
    );
    
    log({ level: 1, color: "GREEN" }, `Added remote origin: ${remoteUrl}`);
  }
};

const checkRemoteRepository = async (repoUrl: string): Promise<boolean> => {
  try {
    // Check if repository exists by trying to access it
    await execute(
      {
        command: `git ls-remote ${repoUrl}`,
        dir: "/tmp",
      },
      "checkRemoteRepository"
    );
    return true;
  } catch (error) {
    return false;
  }
};

const createRemoteRepository = async (repoUrl: string): Promise<void> => {
  try {
    // Extract repository information from URL
    const urlMatch = repoUrl.match(/^(https?:\/\/[^\/]+)\/([^\/]+)\/([^\/]+)\.git$/);
    if (!urlMatch) {
      throw new Error(`Invalid repository URL format: ${repoUrl}`);
    }
    
    const [, baseUrl, username, repoName] = urlMatch;
    
    // Try GitHub CLI first (gh)
    try {
      await execute(
        {
          command: `gh repo create ${username}/${repoName} --public --confirm`,
          dir: "/tmp",
        },
        "createRemoteRepository"
      );
      return;
    } catch (ghError) {
      // If GitHub CLI fails, throw error
      throw new Error(`Cannot create repository automatically. Please create it manually and try again.`);
    }
    
  } catch (error) {
    throw error;
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
    
    // Check if repository exists before attempting to delete
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

    // First pass: verify and create all remote repositories
    const submoduleConfigs = [];
    for (const dir of directories) {
      let submoduleUrl;
      let remoteExists = false;
      
      if (gitDomain) {
        // Extract base URL from git domain (remove .git if present)
        const baseUrl = gitDomain.replace(/\.git$/, '');
        // Get the app name from the project directory (remove _umbrella suffix)
        const projectName = projectDir.split('/').pop()?.replace('_umbrella', '') || '';
        // Determine repository name: if folder name matches app name exactly, add _lib suffix
        const repoName = dir === projectName ? `${projectName}_lib` : dir;
        submoduleUrl = `${baseUrl}/${repoName}.git`;
        
        // Check if remote repository exists
        remoteExists = await checkRemoteRepository(submoduleUrl);
        if (!remoteExists) {
          // Try to create the remote repository
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
        // Fallback to local path if no git domain
        submoduleUrl = `./${dir}`;
      }
      
      submoduleConfigs.push({ dir, submoduleUrl, remoteExists });
    }

    // Second pass: prepare directories and add as submodules
    for (const { dir, submoduleUrl, remoteExists } of submoduleConfigs) {
      const appPath = join(appsDir, dir);
      
      // Remove existing git repository if it exists
      await execute(
        {
          command: "rm -rf .git",
          dir: appPath,
        },
        "addGitSubmodules"
      );

      if (gitDomain && remoteExists) {
        // Initialize local git repository in app directory
        await execute(
          {
            command: "git init",
            dir: appPath,
          },
          "addGitSubmodules"
        );

        // Add remote origin
        await execute(
          {
            command: `git remote add origin ${submoduleUrl}`,
            dir: appPath,
          },
          "addGitSubmodules"
        );

        // Add and commit all content
        await execute(
          {
            command: "git add .",
            dir: appPath,
          },
          "addGitSubmodules"
        );

        await execute(
          {
            command: 'git commit -m "Initial commit"',
            dir: appPath,
          },
          "addGitSubmodules"
        );

        // Push content to remote repository
        await execute(
          {
            command: "git push -u origin master",
            dir: appPath,
          },
          "addGitSubmodules"
        );
        
        log({ level: 1, color: "GREEN" }, `Pushed ${dir} content to remote repository`);
      }

      // Remove the directory from git index if it exists (since it was created during Phoenix generation)
      try {
        await execute(
          {
            command: `git rm -r --cached apps/${dir}`,
            dir: projectDir,
          },
          "addGitSubmodules"
        );
      } catch (error) {
        // Directory might not be in index, that's ok
        log({ level: 2, color: "YELLOW" }, `Directory apps/${dir} not in git index, continuing...`);
      }

      // Add as submodule to parent repo with external URL
      await execute(
        {
          command: `git submodule add ${submoduleUrl} apps/${dir}`,
          dir: projectDir,
        },
        "addGitSubmodules"
      );

      log({ level: 1, color: "GREEN" }, `Added submodule: apps/${dir} -> ${submoduleUrl}`);
    }

    // Commit submodule additions
    await execute(
      {
        command: 'git commit -m "Add app submodules"',
        dir: projectDir,
      },
      "addGitSubmodules"
    );

    // Push the umbrella repository with submodule changes
    if (gitDomain) {
      await execute(
        {
          command: "git push -u origin master",
          dir: projectDir,
        },
        "addGitSubmodules"
      );
      
      log({ level: 1, color: "GREEN" }, `Pushed umbrella repository with submodules`);
    }

  } catch (error) {
    log({ level: 1, color: "RED" }, "Error setting up submodules:", error);
    throw error; // Re-throw to make the error visible and stop the process
  }
};
