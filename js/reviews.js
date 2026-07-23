// ============================================================================
// Avaliações de clientes — carregadas do Supabase
// ============================================================================

async function carregarAvaliacoes(limite = null) {
  const wrap = document.getElementById('review-grid');
  if (!wrap) return;
  wrap.innerHTML = '<p style="text-align:center;color:var(--text-muted);grid-column:1/-1;">Carregando avaliações...</p>';

  let query = supabaseClient.from('avaliacoes').select('*').order('criado_em', { ascending: false });
  if (limite) query = query.limit(limite);

  const { data, error } = await query;

  if (error) {
    wrap.innerHTML = '<p style="text-align:center;color:var(--text-muted);grid-column:1/-1;">Não foi possível carregar as avaliações.</p>';
    return;
  }

  if (!data || data.length === 0) {
    wrap.innerHTML = `<div class="empty-state" style="grid-column:1/-1;">${iconePartial('heart')}<p>Ainda não há avaliações por aqui.<br>Seja a próxima pessoa a compartilhar seu mimo!</p></div>`;
    return;
  }

  wrap.innerHTML = data.map(avaliacaoCardHTML).join('');
}

function avaliacaoCardHTML(a) {
  const estrelas = '★'.repeat(a.nota || 5) + '☆'.repeat(5 - (a.nota || 5));
  return `
    <article class="review-card">
      ${a.foto_url ? `<div class="review-media"><img src="${a.foto_url}" alt="Foto do pedido de ${a.nome_cliente}" loading="lazy"></div>` : ''}
      <div class="review-stars">${estrelas}</div>
      <p class="review-comment">${a.comentario ? escapeHtml(a.comentario) : ''}</p>
      <div class="review-author">— <strong>${escapeHtml(a.nome_cliente)}</strong></div>
    </article>`;
}

document.addEventListener('DOMContentLoaded', () => {
  const wrap = document.getElementById('review-grid');
  if (wrap) carregarAvaliacoes(wrap.dataset.limite ? Number(wrap.dataset.limite) : null);
});
