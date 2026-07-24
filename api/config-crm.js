export default function handler(req, res) {
  res.status(200).json({
    APP_SUPABASE_URL: process.env.APP_SUPABASE_URL,
    APP_SUPABASE_KEY: process.env.APP_SUPABASE_KEY,
  });
}
