document.addEventListener('DOMContentLoaded', async () => {
  const container = document.getElementById('product-detail');
  if (!container) return;

  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');

  if (!id) {
    container.innerHTML = `
      <div class="empty-state">
        ${iconePartial('gift')}
        <p>Produto não encontrado.<br><a href="index.html" class="btn btn-outline" style="margin-top:12px;display:inline-flex;">Voltar ao catálogo</a></p>
      </div>
    `;
    return;
  }

  const { data, error } = await supabaseClient
    .from('produtos')
    .select('id,nome,descricao,preco,imagem_url,ocasiao,categoria,ativo,destaque,criado_em')
    .eq('id', id)
    .eq('ativo', true)
    .single();

  if (error || !data) {
    container.innerHTML = `
      <div class="empty-state">
        ${iconePartial('gift')}
        <p>Não foi possível carregar este presente agora.<br><a href="index.html" class="btn btn-outline" style="margin-top:12px;display:inline-flex;">Voltar ao catálogo</a></p>
      </div>
    `;
    return;
  }

  const produto = data;
  const imagens = [
    produto.imagem_url || 'https://placehold.co/900x700/FBEAEA/B54B5A?text=Mimos+com+Encanto',
    ...(Array.isArray(produto.imagens_adicionais) ? produto.imagens_adicionais.filter(Boolean) : [])
  ].filter((img, index, arr) => img && arr.indexOf(img) === index);

  const html = `
    <article class="product-detail-card">
      <div class="product-detail-media">
        <div class="product-detail-gallery">
          <img class="product-detail-main-image" src="${imagens[0]}" alt="${produto.nome}" loading="eager">
          <div class="product-detail-thumbs">
            ${imagens.map((img, index) => `
              <button class="product-detail-thumb ${index === 0 ? 'active' : ''}" type="button" data-image="${img}" aria-label="Ver foto ${index + 1} do produto">
                <img src="${img}" alt="${produto.nome} ${index + 1}" loading="lazy">
              </button>
            `).join('')}
          </div>
        </div>
      </div>
      <div class="product-detail-info">
        <span class="eyebrow">${labelOcasiao(produto.ocasiao)}</span>
        <h1>${produto.nome}</h1>
        <div class="price" style="font-size:2rem; margin: 8px 0 12px;">${formatarPreco(produto.preco)}</div>
        <p class="product-detail-description">${produto.descricao ? escapeHtml(produto.descricao) : 'Presente especial pensado para tornar sua mensagem ainda mais memorável.'}</p>

        <div class="product-detail-meta">
          <div><strong>Tipo</strong><span>${labelCategoria(produto.categoria)}</span></div>
          <div><strong>Entrega</strong><span>Prazo sob confirmação</span></div>
          <div><strong>Personalização</strong><span>Disponível ao conversar no WhatsApp</span></div>
        </div>

        <div class="product-detail-actions">
          <button class="btn btn-primary" onclick="adicionarAoCarrinho(${JSON.stringify(produto).replace(/'/g, "&#39;")}); abrirCarrinho();">Adicionar ao carrinho</button>
          <a href="index.html#catalogo" class="btn btn-outline">Ver mais presentes</a>
        </div>
      </div>
    </article>
  `;

  container.innerHTML = html;

  container.querySelectorAll('.product-detail-thumb').forEach((thumb) => {
    thumb.addEventListener('click', () => {
      const image = thumb.dataset.image;
      const mainImage = container.querySelector('.product-detail-main-image');
      if (mainImage && image) mainImage.src = image;
      container.querySelectorAll('.product-detail-thumb').forEach((item) => item.classList.toggle('active', item === thumb));
    });
  });
});
