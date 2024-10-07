import { generateFile } from "./index";

const gen_react_config = async (AppName: string, UiDir: string) => {
    const content = `
${AppName.toUpperCase()}_WEB_API_URL=http://localhost:4000/api
${AppName.toUpperCase()}_FEATURE_FLAG_EXAMPLE=true

# ENV setting can be programmatically detected with process.env.NODE_ENV
# ENV setting can be forced with command line: NODE_ENV=staging npm run build

# ENV variables can be accessed with process.env.VAR_NAME
#           Ex: process.env.${AppName.toUpperCase()}_WEB_API_URL
#           Value: "http://localhost:4000/api"

# Copy to .env.production for production settings or .env.test for test settings
`;

    return generateFile({ dir: UiDir, filename: ".env.development", content });
};

export { gen_react_config };
