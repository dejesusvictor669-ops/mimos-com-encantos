// ============================================================================
// Carrinho de compras — persistido no localStorage do navegador do cliente
// ============================================================================

const CARRINHO_KEY = 'mimos_carrinho';

function lerCarrinho() {
  try { return JSON.parse(localStorage.getItem(CARRINHO_KEY)) || []; }
  catch { return []; }
}

function salvarCarrinho(itens) {
  localStorage.setItem(CARRINHO_KEY, JSON.stringify(itens));
  atualizarContadorCarrinho();
}

function adicionarAoCarrinho(produto) {
  const itens = lerCarrinho();
  const existente = itens.find(i => i.id === produto.id);
  if (existente) {
    existente.quantidade += 1;
  } else {
    itens.push({
      id: produto.id,
      nome: produto.nome,
      preco: produto.preco,
      imagem_url: produto.imagem_url,
      quantidade: 1
    });
  }
  salvarCarrinho(itens);
  mostrarToast(`${produto.nome} adicionado ao carrinho ✿`);
  renderizarCarrinho();
}

function alterarQuantidade(id, delta) {
  let itens = lerCarrinho();
  itens = itens.map(i => i.id === id ? { ...i, quantidade: i.quantidade + delta } : i).filter(i => i.quantidade > 0);
  salvarCarrinho(itens);
  renderizarCarrinho();
}

function removerDoCarrinho(id) {
  const itens = lerCarrinho().filter(i => i.id !== id);
  salvarCarrinho(itens);
  renderizarCarrinho();
}

function totalCarrinho() {
  return lerCarrinho().reduce((soma, i) => soma + i.preco * i.quantidade, 0);
}

function atualizarResumoCheckout() {
  const subtotal = totalCarrinho();
  const entregaSelect = document.getElementById('checkout-entrega');
  const valorEntrega = entregaSelect && entregaSelect.value === 'retirada' ? 0 : 15;

  const subtotalEl = document.getElementById('checkout-subtotal');
  const valorEntregaEl = document.getElementById('checkout-entrega-valor');
  const totalEl = document.getElementById('checkout-total');

  if (subtotalEl) subtotalEl.textContent = formatarPreco(subtotal);
  if (valorEntregaEl) valorEntregaEl.textContent = formatarPreco(valorEntrega);
  if (totalEl) totalEl.textContent = formatarPreco(subtotal + valorEntrega);
}

function atualizarContadorCarrinho() {
  const total = lerCarrinho().reduce((s, i) => s + i.quantidade, 0);
  document.querySelectorAll('.cart-count').forEach(el => {
    el.textContent = total;
    el.style.display = total > 0 ? 'flex' : 'none';
  });
}

function renderizarCarrinho() {
  const wrap = document.getElementById('cart-items');
  if (!wrap) return;
  const itens = lerCarrinho();

  if (itens.length === 0) {
    wrap.innerHTML = `<div class="empty-state">${iconePartial('bag')}<p>Seu carrinho está vazio.<br>Que tal escolher um mimo especial?</p></div>`;
  } else {
    wrap.innerHTML = itens.map(i => `
      <div class="cart-item">
        <img src="${i.imagem_url || 'https://placehold.co/100x100/FBEAEA/B54B5A?text=%E2%9C%BF'}" alt="${i.nome}">
        <div class="cart-item-info">
          <h4>${i.nome}</h4>
          <div class="cart-item-price">${formatarPreco(i.preco * i.quantidade)}</div>
          <div class="qty-control">
            <button class="qty-btn" onclick="alterarQuantidade('${i.id}', -1)">−</button>
            <span class="qty-value">${i.quantidade}</span>
            <button class="qty-btn" onclick="alterarQuantidade('${i.id}', 1)">+</button>
            <button class="remove-item" onclick="removerDoCarrinho('${i.id}')">remover</button>
          </div>
        </div>
      </div>`).join('');
  }

  const totalEl = document.getElementById('cart-total-value');
  if (totalEl) totalEl.textContent = formatarPreco(totalCarrinho());
  atualizarResumoCheckout();
}

function abrirCarrinho() {
  document.querySelector('.cart-overlay')?.classList.add('open');
  document.querySelector('.cart-drawer')?.classList.add('open');
  renderizarCarrinho();
}
function fecharCarrinho() {
  document.querySelector('.cart-overlay')?.classList.remove('open');
  document.querySelector('.cart-drawer')?.classList.remove('open');
}

// ----------------------------------------------------------------------------
// Finalizar pedido: grava no Supabase e redireciona para o WhatsApp
// ----------------------------------------------------------------------------
async function finalizarPedido(event) {
  event.preventDefault();

  const itens = lerCarrinho();
  if (itens.length === 0) { mostrarToast('Seu carrinho está vazio.'); return; }

  const nome = document.getElementById('checkout-nome').value.trim();
  const telefone = document.getElementById('checkout-telefone').value.trim();
  const obs = document.getElementById('checkout-obs').value.trim();
  const metodoEntrega = document.getElementById('checkout-entrega')?.value || 'entrega';
  const formaPagamento = document.getElementById('checkout-pagamento')?.value || 'pix';
  const valorEntrega = metodoEntrega === 'retirada' ? 0 : 15;

  if (!nome || !telefone) { mostrarToast('Preencha seu nome e telefone.'); return; }

  const btn = document.getElementById('btn-finalizar');
  btn.disabled = true;
  btn.textContent = 'Enviando pedido...';

  const codigo = gerarCodigoRastreio();
  const subtotal = totalCarrinho();
  const total = subtotal + valorEntrega;

  const { error } = await supabaseClient.from('pedidos').insert({
    codigo_rastreio: codigo,
    nome_cliente: nome,
    telefone_cliente: telefone,
    itens: itens,
    total: total,
    observacoes: obs,
    status: 'pendente',
    metodo_entrega: metodoEntrega,
    forma_pagamento: formaPagamento,
    valor_entrega: valorEntrega
  });

  if (error) {
    console.error(error);
    mostrarToast('Não foi possível enviar o pedido. Tente novamente.');
    btn.disabled = false;
    btn.textContent = 'Finalizar pedido no WhatsApp';
    return;
  }

  const linhas = itens.map(i => `• ${i.quantidade}x ${i.nome} — ${formatarPreco(i.preco * i.quantidade)}`).join('\n');
  const entregaTexto = metodoEntrega === 'retirada'
    ? 'Retirada na loja'
    : `Entrega em casa (+ ${formatarPreco(valorEntrega)})`;

  const mensagem =
`Olá! Gostaria de confirmar meu pedido 🎁

*Código do pedido:* ${codigo}
*Nome:* ${nome}
*Forma de entrega:* ${entregaTexto}
*Pagamento:* ${formaPagamento === 'pix' ? 'Pix' : formaPagamento === 'transferencia' ? 'Transferência' : 'Dinheiro'}

${linhas}

*Subtotal:* ${formatarPreco(subtotal)}
*Entrega:* ${formatarPreco(valorEntrega)}
*Total:* ${formatarPreco(total)}
${obs ? `\n*Observações:* ${obs}` : ''}

Aguardo a confirmação, obrigado(a)!`;

  localStorage.removeItem(CARRINHO_KEY);
  window.location.href = linkWhatsapp(mensagem);
}

document.addEventListener('DOMContentLoaded', () => {
  const entregaSelect = document.getElementById('checkout-entrega');
  if (entregaSelect) {
    entregaSelect.addEventListener('change', atualizarResumoCheckout);
  }

  atualizarContadorCarrinho();
  renderizarCarrinho();
});
