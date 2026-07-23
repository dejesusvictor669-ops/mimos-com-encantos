// ============================================================================
// Acompanhar pedido pelo código de rastreio
// ============================================================================

const ETAPAS = ['pendente', 'confirmado', 'preparando', 'pronto', 'entregue'];
const ETAPA_LABEL = {
  pendente: 'Pedido recebido',
  confirmado: 'Pedido confirmado',
  preparando: 'Em preparação',
  pronto: 'Pronto para entrega/retirada',
  entregue: 'Entregue'
};

async function buscarPedido(event) {
  event.preventDefault();
  const codigo = document.getElementById('input-codigo').value.trim().toUpperCase();
  const resultado = document.getElementById('resultado-pedido');
  if (!codigo) return;

  resultado.innerHTML = '<p style="text-align:center;color:var(--text-muted);">Buscando pedido...</p>';

  let data, error;
  try {
    const resposta = await supabaseClient.rpc('buscar_pedido_por_codigo', { p_codigo: codigo });
    data = resposta.data;
    error = resposta.error;
  } catch (err) {
    console.error('Erro ao buscar pedido:', err);
    resultado.innerHTML = `<div class="empty-state">${iconePartial('box')}<p>Não foi possível conectar ao servidor. Verifique sua internet e tente novamente.</p></div>`;
    return;
  }

  if (error) {
    console.error('Erro retornado pelo Supabase:', error);
    resultado.innerHTML = `<div class="empty-state">${iconePartial('box')}<p>Ocorreu um erro ao buscar o pedido. Tente novamente em instantes.</p></div>`;
    return;
  }

  if (!data || data.length === 0) {
    resultado.innerHTML = `<div class="empty-state">${iconePartial('box')}<p>Não encontramos nenhum pedido com esse código.<br>Confira se digitou certinho.</p></div>`;
    return;
  }

  const pedido = data[0];
  const passoAtual = ETAPAS.indexOf(pedido.status);
  const itensHtml = (pedido.itens || []).map(i => `<li>${i.quantidade}x ${i.nome} — ${formatarPreco(i.preco * i.quantidade)}</li>`).join('');

  resultado.innerHTML = `
    <div class="card">
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;margin-bottom:20px;">
        <div>
          <span class="eyebrow" style="margin-bottom:0;">Pedido ${pedido.codigo_rastreio}</span>
          <div style="font-size:.85rem;color:var(--text-muted);">Olá, ${escapeHtml(pedido.nome_cliente || '')}!</div>
        </div>
        <span class="status-badge status-${pedido.status}">${ETAPA_LABEL[pedido.status] || pedido.status}</span>
      </div>

      <div class="tracking-steps">
        ${ETAPAS.map((etapa, i) => `
          <div class="tracking-step ${i <= passoAtual ? 'done' : ''}">
            <span class="dot"></span>
            <span class="label">${ETAPA_LABEL[etapa]}</span>
          </div>`).join('')}
      </div>

      <hr style="border:none;border-top:1px solid var(--line);margin:24px 0;">

      <h4 style="font-family:var(--font-body);font-size:.95rem;margin-bottom:10px;">Itens do pedido</h4>
      <ul style="font-size:.88rem;color:var(--text-muted);line-height:2;margin-bottom:14px;">${itensHtml}</ul>
      <div style="font-weight:600;color:var(--rose-deep);">Total: ${formatarPreco(pedido.total)}</div>
      ${pedido.observacoes ? `<div style="margin-top:10px;font-size:.85rem;color:var(--text-muted);"><strong>Obs.:</strong> ${escapeHtml(pedido.observacoes)}</div>` : ''}
    </div>`;
}