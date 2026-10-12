// Configuración pública de la landing.
// La clave pública (anon / publishable) está pensada para ir en el navegador; la protege RLS.
// NUNCA pegues aquí la clave service_role ni la clave secreta.
window.APP_CONFIG = {
  APP_NAME: "PasoAPaso",                              // nombre provisional: cámbialo cuando lo decidas
  SUPABASE_URL: "https://yliuguozwzkuupltmihc.supabase.co",     // Project Settings > API > Project URL
  SUPABASE_PUBLIC_KEY: "sb_publishable_i1WBR4MYEXW-tmMOgjFHaA_BkZBjuCw"    // anon key (eyJ...) o publishable key (sb_publishable_...)
};
