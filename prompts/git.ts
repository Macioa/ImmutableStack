import { getSetting, updateSetting } from "@/utils/settings";
import { promptUser } from "./index";

export const promptGitDomain = async (): Promise<string> => {
  const defaultDomain = await getSetting("gitDom");
  const domain = await promptUser(
    "Enter git domain for remote repository",
    defaultDomain
  );
  
  // Only save to settings if user provided a non-empty value
  if (domain && domain !== defaultDomain) {
    await updateSetting({ gitDom: domain });
  }
  
  // Return the domain (either user input or default from settings)
  return domain || defaultDomain || "";
};
