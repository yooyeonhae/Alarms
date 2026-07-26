const fs = require("fs");
const path = require("path");

const weatherApiKey = process.env.WEATHER_API_KEY || "";
const supabaseNewsFunctionUrl = process.env.SUPABASE_NEWS_FUNCTION_URL || "";
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || "";
const appsScriptUrl = process.env.APPS_SCRIPT_URL || "";

const content = `const WEATHER_CONFIG = {
  apiKey: ${JSON.stringify(weatherApiKey)},
  lat: 37.5665,
  lon: 126.9780,
};

const SUPABASE_NEWS_FUNCTION_URL = ${JSON.stringify(supabaseNewsFunctionUrl)};
const SUPABASE_ANON_KEY = ${JSON.stringify(supabaseAnonKey)};

const APPS_SCRIPT_URL = ${JSON.stringify(appsScriptUrl)};
`;

fs.writeFileSync(path.join(__dirname, "..", "config.js"), content);
console.log("config.js generated from environment variables.");
