// ============================================================================
// Utilidades compartilhadas entre as páginas
// ============================================================================

function formatarPreco(valor) {
  return Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function mostrarToast(mensagem) {
  let toast = document.querySelector('.toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = mensagem;
  toast.classList.add('show');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove('show'), 2600);
}

function gerarCodigoRastreio() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // 32 símbolos, sem I/O/0/1 para evitar confusão
  const tamanho = 8; // 32^8 combinações — acima do que dá para força bruta em tempo hábil
  const valores = new Uint32Array(tamanho);
  crypto.getRandomValues(valores);
  let codigo = 'ME-';
  for (let i = 0; i < tamanho; i++) codigo += chars[valores[i] % chars.length];
  return codigo;
}

function labelOcasiao(valor) {
  const mapa = {
    'dia-das-maes': 'Dia das Mães',
    'dia-dos-pais': 'Dia dos Pais',
    'namorados': 'Dia dos Namorados',
    'aniversario': 'Aniversário',
    'natal': 'Natal',
    'amigo-secreto': 'Amigo Secreto',
    'outro': 'Qualquer Ocasião'
  };
  return mapa[valor] || 'Qualquer Ocasião';
}

function labelCategoria(valor) {
  const mapa = {
    'cestas': 'Cestas Personalizadas',
    'canecas': 'Canecas & Copos',
    'decoracao': 'Decoração de Festas',
    'lembrancinhas': 'Lembrancinhas',
    'kits': 'Kits & Presentes Especiais',
    'outro': 'Outros'
  };
  return mapa[valor] || 'Outros';
}

function toggleMobileNav() {
  document.querySelector('.nav-links')?.classList.toggle('mobile-open');
}

// Escapa texto do usuário antes de inserir no HTML (evita quebra de layout e XSS)
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str == null ? '' : str;
  return div.innerHTML;
}

// Monta o link do WhatsApp com uma mensagem pré-formatada
function linkWhatsapp(mensagem) {
  const numero = (typeof WHATSAPP_NUMERO !== 'undefined') ? WHATSAPP_NUMERO : '';
  return `https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}`;
}

function formatarTelefone(telefone) {
  const valor = String(telefone || '').replace(/\D/g, '');
  if (valor.length === 11) {
    return `(${valor.slice(0, 2)}) ${valor.slice(2, 7)}-${valor.slice(7)}`;
  }
  if (valor.length === 10) {
    return `(${valor.slice(0, 2)}) ${valor.slice(2, 6)}-${valor.slice(6)}`;
  }
  return valor || 'Não informado';
}

function criarMensagemPedido({ nome, codigo, itens, total, entregaTexto, pagamentoTexto, observacoes = '' }) {
  const linhas = itens.map(i => `• ${i.quantidade}x ${i.nome} — ${formatarPreco(i.preco * i.quantidade)}`).join('\n');
  const observacaoTexto = observacoes ? `\n*Observações:* ${observacoes}` : '';

  return `Olá! Gostaria de confirmar meu pedido 🎁\n\n` +
    `*Código do pedido:* ${codigo}\n` +
    `*Nome:* ${nome}\n` +
    `*Forma de entrega:* ${entregaTexto}\n` +
    `*Pagamento:* ${pagamentoTexto}\n\n` +
    `${linhas}\n\n` +
    `*Total:* ${formatarPreco(total)}${observacaoTexto}\n\n` +
    `Aguardo a confirmação, obrigado(a)!`;
}

function injetarDadosEstruturados() {
  const existing = document.querySelector('script[data-schema="local-business"]');
  if (existing) return;

  const payload = {
    '@context': 'https://schema.org',
    '@type': 'Store',
    name: 'Mimos com Encanto',
    image: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?q=80&w=800&auto=format&fit=crop',
    description: 'Cestas, kits, canecas e presentes personalizados com atenção aos detalhes e entrega com carinho.',
    telephone: '+55-31-97266-7424',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Betim',
      addressRegion: 'MG',
      addressCountry: 'BR'
    },
    priceRange: '$$',
    url: 'https://mimos-com-encanto.vercel.app/'
  };

  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.dataset.schema = 'local-business';
  script.textContent = JSON.stringify(payload);
  document.head.appendChild(script);
}

// Ícones (mesma família de linha, para não misturar estilos)
const ICONS = {
  bag: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8h12l-1 12H7L6 8Z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg>',
  gift: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="9" width="18" height="11" rx="1"/><path d="M3 9h18v4H3z" opacity=".5"/><path d="M12 9v11M12 9c-1.5-4-6-4-6-1.2C6 9.5 8 9 12 9Zm0 0c1.5-4 6-4 6-1.2 0 1.7-2 1.2-6 1.2Z"/></svg>',
  star: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.5l2.9 6.3 6.9.7-5.2 4.6 1.6 6.8L12 17.6l-6.2 3.3 1.6-6.8L2.2 9.5l6.9-.7L12 2.5Z"/></svg>',
  truck: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7h11v9H3z"/><path d="M14 11h4l3 3v2h-7v-5Z"/><circle cx="7" cy="18" r="1.6"/><circle cx="17.5" cy="18" r="1.6"/></svg>',
  heart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20s-7-4.4-9.5-8.8C.7 7.7 2.6 4 6.3 4c2 0 3.6 1.2 4.7 2.9C12.1 5.2 13.7 4 15.7 4c3.7 0 5.6 3.7 3.8 7.2C19 15.6 12 20 12 20Z"/></svg>',
  close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  chat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.4 8.4 0 0 1-8.9 8.4 8.6 8.6 0 0 1-3.8-.9L3 20l1.1-4.3A8.3 8.3 0 0 1 3 11.5 8.4 8.4 0 0 1 11.9 3a8.5 8.5 0 0 1 9.1 8.5Z"/></svg>',
  search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>',
  box: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 8 12 3 3 8l9 5 9-5Z"/><path d="M3 8v9l9 5 9-5V8"/><path d="M12 13v9"/></svg>',
  camera: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8h3l2-2h6l2 2h3v11H4z"/><circle cx="12" cy="13.5" r="3.5"/></svg>'
};

function iconePartial(nome) { return ICONS[nome] || ''; }

// ============================================================================
// Atalho para a área administrativa: 3 cliques seguidos na logo
// (o acesso continua protegido por login/senha no Supabase — isso é só
// um jeito rápido de chegar na tela de login sem precisar guardar o link)
// ============================================================================
document.addEventListener('DOMContentLoaded', () => {
  const badge = document.querySelector('.brand-badge');
  if (badge) {
    let cliques = 0;
    let timer = null;
    badge.style.cursor = 'pointer';

    badge.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();

      cliques++;
      clearTimeout(timer);
      timer = setTimeout(() => { cliques = 0; }, 1200);

      if (cliques >= 3) {
        cliques = 0;
        const emAdmin = window.location.pathname.includes('/admin/');
        window.location.href = emAdmin ? 'login.html' : 'admin/login.html';
      }
    });
  }

  if (!window.location.pathname.includes('/admin/')) {
    injetarDadosEstruturados();
  }

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./service-worker.js').catch(() => {});
    });
  }
});