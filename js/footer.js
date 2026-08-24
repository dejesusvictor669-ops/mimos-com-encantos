// ============================================================================
// Rodapé compartilhado — injetado em todas as páginas públicas
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
  const placeholder = document.getElementById('footer-placeholder');
  if (!placeholder) return;

  placeholder.innerHTML = `
  <footer class="site-footer">
    <div class="container">
      <div class="footer-grid">
        <div class="footer-brand">
          <span class="brand-name">Mimos <em>com encanto</em></span>
          <p>Presentes personalizados feitos com carinho para transformar qualquer data em uma lembrança especial.</p>
        </div>
        <div class="footer-col">
          <h5>Navegue</h5>
          <ul>
            <li><a href="index.html">Início</a></li>
            <li><a href="index.html#catalogo">Catálogo</a></li>
            <li><a href="avaliacoes.html">Avaliações</a></li>
            <li><a href="acompanhar-pedido.html">Acompanhar pedido</a></li>
            <li><a href="faq.html">FAQ & Política</a></li>
          </ul>
        </div>
        <div class="footer-col">
          <h5>Contato</h5>
          <ul>
            <li>Betim - MG e região</li>
            <li><a href="#" id="footer-whatsapp">(31) 97266-7424</a></li>
            <li><a href="https://instagram.com/mimos_com_encanto_oficial" target="_blank" rel="noopener">@mimos_com_encanto_oficial</a></li>
          </ul>
        </div>
      </div>
      <div class="footer-bottom">© ${new Date().getFullYear()} Mimos com Encanto — feito com carinho</div>
    </div>
  </footer>`;

  const wa = document.getElementById('footer-whatsapp');
  if (wa) wa.href = linkWhatsapp('Olá! Vim pelo site da Mimos com Encanto 🎁');
});
