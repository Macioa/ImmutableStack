import { getSetting, updateSetting } from "@/utils/settings";
import { promptUser } from "./index";

export const promptGitDomain = async (): Promise<string> => {
  const defaultDomain = await getSetting("gitDom");
  
  // @ts-ignore
  if (defaultDomain === false || typeof defaultDomain === "string")
    return defaultDomain || "";
  
  const domain = await promptUser("Enter git domain for remote repository", defaultDomain);
  
  if (domain && domain !== defaultDomain)
    await updateSetting({ gitDom: domain });
  
  return domain || defaultDomain || "";
};
