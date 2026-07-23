// ============================================================================
// Catálogo de produtos — home
// ============================================================================

let TODOS_PRODUTOS = [];
let filtroOcasiao = 'todos';
let filtroCategoria = 'todos';

async function carregarProdutos() {
  const grid = document.getElementById('product-grid');
  grid.innerHTML = '<p style="text-align:center;color:var(--text-muted);grid-column:1/-1;">Carregando presentes...</p>';

  const { data, error } = await supabaseClient
    .from('produtos')
    .select('*')
    .eq('ativo', true)
    .order('criado_em', { ascending: false });

  if (error) {
    console.error(error);
    grid.innerHTML = '<p style="text-align:center;color:var(--text-muted);grid-column:1/-1;">Não foi possível carregar os produtos agora. Tente novamente em instantes.</p>';
    return;
  }

  TODOS_PRODUTOS = data || [];
  montarFiltros();
  renderizarProdutos();
}

function montarFiltros() {
  const ocasioes = [...new Set(TODOS_PRODUTOS.map(p => p.ocasiao).filter(Boolean))];
  const categorias = [...new Set(TODOS_PRODUTOS.map(p => p.categoria).filter(Boolean))];

  const wrapOcasiao = document.getElementById('filtro-ocasiao');
  const wrapCategoria = document.getElementById('filtro-categoria');
  if (!wrapOcasiao || !wrapCategoria) return;

  wrapOcasiao.innerHTML = `<button class="chip active" data-tipo="ocasiao" data-valor="todos">Todas as datas</button>` +
    ocasioes.map(o => `<button class="chip" data-tipo="ocasiao" data-valor="${o}">${labelOcasiao(o)}</button>`).join('');

  wrapCategoria.innerHTML = `<button class="chip active" data-tipo="categoria" data-valor="todos">Todos os tipos</button>` +
    categorias.map(c => `<button class="chip" data-tipo="categoria" data-valor="${c}">${labelCategoria(c)}</button>`).join('');

  document.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const tipo = chip.dataset.tipo;
      const valor = chip.dataset.valor;
      document.querySelectorAll(`.chip[data-tipo="${tipo}"]`).forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      if (tipo === 'ocasiao') filtroOcasiao = valor; else filtroCategoria = valor;
      renderizarProdutos();
    });
  });
}

function renderizarProdutos() {
  const grid = document.getElementById('product-grid');
  let lista = TODOS_PRODUTOS;
  if (filtroOcasiao !== 'todos') lista = lista.filter(p => p.ocasiao === filtroOcasiao);
  if (filtroCategoria !== 'todos') lista = lista.filter(p => p.categoria === filtroCategoria);

  if (lista.length === 0) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1;">${iconePartial('gift')}<p>Nenhum presente encontrado com esse filtro ainda.</p></div>`;
    return;
  }

  grid.innerHTML = lista.map(produtoCardHTML).join('');

  grid.querySelectorAll('.add-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const produto = TODOS_PRODUTOS.find(p => p.id === btn.dataset.id);
      if (produto) adicionarAoCarrinho(produto);
    });
  });
}

function produtoCardHTML(p) {
  const imagem = p.imagem_url || 'https://placehold.co/500x420/FBEAEA/B54B5A?text=Mimos+com+Encanto';
  return `
    <article class="product-card">
      <div class="product-media">
        <span class="product-tag">${labelOcasiao(p.ocasiao)}</span>
        <img src="${imagem}" alt="${p.nome}" loading="lazy">
      </div>
      <div class="product-info">
        <h3>${p.nome}</h3>
        <p class="desc">${p.descricao ? escapeHtml(p.descricao) : ''}</p>
        <div class="product-footer">
          <span class="price">${formatarPreco(p.preco)}</span>
          <button class="add-btn" data-id="${p.id}" aria-label="Adicionar ${p.nome} ao carrinho">${iconePartial('bag')}</button>
        </div>
      </div>
    </article>`;
}

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('product-grid')) carregarProdutos();
});