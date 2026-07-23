// ============================================================================
// Painel Administrativo — autenticação + CRUD de produtos, avaliações e pedidos
// Acesso restrito: só quem tiver login/senha criados no Supabase (a admin)
// ============================================================================

const emPaginaAdmin = window.location.pathname.includes('/admin/');
const emLogin = window.location.pathname.endsWith('login.html');

// ----------------------------------------------------------------------------
// Guarda de rota: garante que só usuário autenticado veja o dashboard
// ----------------------------------------------------------------------------
async function protegerRota() {
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (!session && !emLogin) {
    window.location.href = 'login.html';
  }
  if (session && emLogin) {
    window.location.href = 'dashboard.html';
  }
}

async function logout() {
  await supabaseClient.auth.signOut();
  window.location.href = 'login.html';
}

// ----------------------------------------------------------------------------
// Login
// ----------------------------------------------------------------------------
document.getElementById('login-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('email').value.trim();
  const senha = document.getElementById('senha').value;
  const btn = document.getElementById('btn-login');
  const erroBox = document.getElementById('login-error');
  erroBox.style.display = 'none';
  btn.disabled = true;
  btn.textContent = 'Entrando...';

  const { error } = await supabaseClient.auth.signInWithPassword({ email, password: senha });

  if (error) {
    erroBox.textContent = 'E-mail ou senha incorretos.';
    erroBox.style.display = 'block';
    btn.disabled = false;
    btn.textContent = 'Entrar';
    return;
  }
  window.location.href = 'dashboard.html';
});

// ----------------------------------------------------------------------------
// Navegação entre abas do dashboard
// ----------------------------------------------------------------------------
function mudarAba(nome) {
  document.querySelectorAll('.admin-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === nome));
  document.querySelectorAll('.admin-panel').forEach(p => p.classList.remove('active'));
  document.getElementById(`painel-${nome}`).classList.add('active');
  if (nome === 'produtos') carregarProdutosAdmin();
  if (nome === 'avaliacoes') carregarAvaliacoesAdmin();
  if (nome === 'pedidos') carregarPedidosAdmin();
}

function fecharModais() {
  document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('open'));
}

function previsualizarImagem(event, idPreview) {
  const file = event.target.files[0];
  if (!file) return;
  const preview = document.getElementById(idPreview);
  preview.src = URL.createObjectURL(file);
  preview.classList.add('show');
}

// Envia um arquivo para o Storage do Supabase e retorna a URL pública
async function enviarImagem(file, bucket) {
  if (!file) return null;
  const nomeArquivo = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
  const { error } = await supabaseClient.storage.from(bucket).upload(nomeArquivo, file);
  if (error) { console.error(error); throw error; }
  const { data } = supabaseClient.storage.from(bucket).getPublicUrl(nomeArquivo);
  return data.publicUrl;
}

// ============================================================================
// PRODUTOS
// ============================================================================

async function carregarProdutosAdmin() {
  const tbody = document.getElementById('tbody-produtos');
  const { data, error } = await supabaseClient.from('produtos').select('*').order('criado_em', { ascending: false });

  if (error) { tbody.innerHTML = `<tr><td colspan="7">Erro ao carregar produtos.</td></tr>`; return; }
  if (!data || data.length === 0) { tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;color:var(--text-muted);">Nenhum produto cadastrado ainda.</td></tr>`; return; }

  tbody.innerHTML = data.map(p => `
    <tr>
      <td><img src="${p.imagem_url || 'https://placehold.co/80x80/FBEAEA/B54B5A?text=%E2%9C%BF'}" alt=""></td>
      <td>${p.nome}</td>
      <td>${formatarPreco(p.preco)}</td>
      <td>${labelOcasiao(p.ocasiao)}</td>
      <td>${labelCategoria(p.categoria)}</td>
      <td><span class="status-badge ${p.ativo ? 'status-pronto' : 'status-entregue'}">${p.ativo ? 'Ativo' : 'Oculto'}</span></td>
      <td>
        <div class="row-actions">
          <button class="icon-btn" onclick='editarProduto(${JSON.stringify(p).replace(/'/g, "&#39;")})' aria-label="Editar">${iconePartial('box')}</button>
          <button class="icon-btn danger" onclick="excluirProduto('${p.id}')" aria-label="Excluir">${iconePartial('close')}</button>
        </div>
      </td>
    </tr>`).join('');
}

function abrirModalProduto() {
  document.getElementById('form-produto').reset();
  document.getElementById('produto-id').value = '';
  document.getElementById('produto-img-preview').classList.remove('show');
  document.getElementById('modal-produto-titulo').textContent = 'Novo produto';
  document.getElementById('modal-produto').classList.add('open');
}

function editarProduto(p) {
  document.getElementById('produto-id').value = p.id;
  document.getElementById('produto-nome').value = p.nome;
  document.getElementById('produto-descricao').value = p.descricao || '';
  document.getElementById('produto-preco').value = p.preco;
  document.getElementById('produto-ocasiao').value = p.ocasiao || 'outro';
  document.getElementById('produto-categoria').value = p.categoria || 'outro';
  document.getElementById('produto-ativo').checked = p.ativo;
  const preview = document.getElementById('produto-img-preview');
  if (p.imagem_url) { preview.src = p.imagem_url; preview.classList.add('show'); } else { preview.classList.remove('show'); }
  document.getElementById('modal-produto-titulo').textContent = 'Editar produto';
  document.getElementById('modal-produto').classList.add('open');
}

async function salvarProduto(event) {
  event.preventDefault();
  const btn = document.getElementById('btn-salvar-produto');
  btn.disabled = true; btn.textContent = 'Salvando...';

  try {
    const id = document.getElementById('produto-id').value;
    const arquivo = document.getElementById('produto-imagem').files[0];
    const imagemUrl = arquivo ? await enviarImagem(arquivo, 'produtos') : undefined;

    const payload = {
      nome: document.getElementById('produto-nome').value.trim(),
      descricao: document.getElementById('produto-descricao').value.trim(),
      preco: Number(document.getElementById('produto-preco').value),
      ocasiao: document.getElementById('produto-ocasiao').value,
      categoria: document.getElementById('produto-categoria').value,
      ativo: document.getElementById('produto-ativo').checked
    };
    if (imagemUrl) payload.imagem_url = imagemUrl;

    const { error } = id
      ? await supabaseClient.from('produtos').update(payload).eq('id', id)
      : await supabaseClient.from('produtos').insert(payload);

    if (error) throw error;

    mostrarToast('Produto salvo com sucesso!');
    fecharModais();
    carregarProdutosAdmin();
  } catch (err) {
    console.error(err);
    mostrarToast('Não foi possível salvar o produto.');
  } finally {
    btn.disabled = false; btn.textContent = 'Salvar';
  }
}

async function excluirProduto(id) {
  if (!confirm('Tem certeza que deseja excluir este produto?')) return;
  const { error } = await supabaseClient.from('produtos').delete().eq('id', id);
  if (error) { mostrarToast('Erro ao excluir.'); return; }
  mostrarToast('Produto excluído.');
  carregarProdutosAdmin();
}

// ============================================================================
// AVALIAÇÕES
// ============================================================================

async function carregarAvaliacoesAdmin() {
  const tbody = document.getElementById('tbody-avaliacoes');
  const { data, error } = await supabaseClient.from('avaliacoes').select('*').order('criado_em', { ascending: false });

  if (error) { tbody.innerHTML = `<tr><td colspan="5">Erro ao carregar.</td></tr>`; return; }
  if (!data || data.length === 0) { tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:var(--text-muted);">Nenhuma avaliação cadastrada ainda.</td></tr>`; return; }

  tbody.innerHTML = data.map(a => `
    <tr>
      <td><img src="${a.foto_url || 'https://placehold.co/80x80/FBEAEA/B54B5A?text=%E2%9C%BF'}" alt=""></td>
      <td>${a.nome_cliente}</td>
      <td>${'★'.repeat(a.nota)}${'☆'.repeat(5 - a.nota)}</td>
      <td style="max-width:260px;">${(a.comentario || '').slice(0, 80)}</td>
      <td>
        <div class="row-actions">
          <button class="icon-btn danger" onclick="excluirAvaliacao('${a.id}')" aria-label="Excluir">${iconePartial('close')}</button>
        </div>
      </td>
    </tr>`).join('');
}

function abrirModalAvaliacao() {
  document.getElementById('form-avaliacao').reset();
  document.getElementById('avaliacao-id').value = '';
  document.getElementById('avaliacao-img-preview').classList.remove('show');
  document.getElementById('modal-avaliacao').classList.add('open');
}

async function salvarAvaliacao(event) {
  event.preventDefault();
  const btn = document.getElementById('btn-salvar-avaliacao');
  btn.disabled = true; btn.textContent = 'Salvando...';

  try {
    const arquivo = document.getElementById('avaliacao-imagem').files[0];
    const fotoUrl = arquivo ? await enviarImagem(arquivo, 'avaliacoes') : null;

    const payload = {
      nome_cliente: document.getElementById('avaliacao-nome').value.trim(),
      nota: Number(document.getElementById('avaliacao-nota').value),
      comentario: document.getElementById('avaliacao-comentario').value.trim(),
      foto_url: fotoUrl
    };

    const { error } = await supabaseClient.from('avaliacoes').insert(payload);
    if (error) throw error;

    mostrarToast('Avaliação adicionada!');
    fecharModais();
    carregarAvaliacoesAdmin();
  } catch (err) {
    console.error(err);
    mostrarToast('Não foi possível salvar a avaliação.');
  } finally {
    btn.disabled = false; btn.textContent = 'Salvar';
  }
}

async function excluirAvaliacao(id) {
  if (!confirm('Excluir esta avaliação?')) return;
  const { error } = await supabaseClient.from('avaliacoes').delete().eq('id', id);
  if (error) { mostrarToast('Erro ao excluir.'); return; }
  mostrarToast('Avaliação excluída.');
  carregarAvaliacoesAdmin();
}

// ============================================================================
// PEDIDOS
// ============================================================================

const STATUS_OPCOES = ['pendente', 'confirmado', 'preparando', 'pronto', 'entregue'];

async function carregarPedidosAdmin() {
  const tbody = document.getElementById('tbody-pedidos');
  const { data, error } = await supabaseClient.from('pedidos').select('*').order('criado_em', { ascending: false });

  if (error) { tbody.innerHTML = `<tr><td colspan="5">Erro ao carregar pedidos.</td></tr>`; return; }
  if (!data || data.length === 0) { tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:var(--text-muted);">Nenhum pedido recebido ainda.</td></tr>`; return; }

  tbody.innerHTML = data.map(p => `
    <tr>
      <td><strong>${p.codigo_rastreio}</strong></td>
      <td>${p.nome_cliente || '—'}<br><span style="color:var(--text-muted);font-size:.78rem;">${p.telefone_cliente || ''}</span></td>
      <td>${formatarPreco(p.total)}</td>
      <td>
        <select onchange="atualizarStatusPedido('${p.id}', this.value)" style="padding:8px 10px;border-radius:8px;border:1px solid var(--line);font-size:.82rem;">
          ${STATUS_OPCOES.map(s => `<option value="${s}" ${s === p.status ? 'selected' : ''}>${s.charAt(0).toUpperCase() + s.slice(1)}</option>`).join('')}
        </select>
      </td>
      <td>${new Date(p.criado_em).toLocaleDateString('pt-BR')}</td>
    </tr>`).join('');
}

async function atualizarStatusPedido(id, novoStatus) {
  const { error } = await supabaseClient.from('pedidos').update({ status: novoStatus, atualizado_em: new Date().toISOString() }).eq('id', id);
  if (error) { mostrarToast('Erro ao atualizar status.'); return; }
  mostrarToast('Status do pedido atualizado.');
}

// ----------------------------------------------------------------------------
// Inicialização
// ----------------------------------------------------------------------------
if (emPaginaAdmin) {
  protegerRota().then(() => {
    if (document.getElementById('tbody-produtos')) carregarProdutosAdmin();
  });
}
