// ============================================================================
// Configuração do Supabase
// Preencha com os dados do SEU projeto (Painel Supabase > Project Settings > API)
// SUPABASE_URL:      Project URL
// SUPABASE_ANON_KEY: chave "anon public" (NUNCA use a "service_role" aqui!)
// ============================================================================

const SUPABASE_URL = 'https://gugheupscvgfshyisoxo.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_zyvhNp8DxWbK0oHYQ49Yqw_pHuxXJDe';

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Número de WhatsApp da loja, formato internacional sem espaços/símbolos
// Ex: 55 31 97266-7424  ->  5531972667424
const WHATSAPP_NUMERO = '5531972667424';
    