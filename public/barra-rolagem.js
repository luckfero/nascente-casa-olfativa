/* Varanda Estúdio Web — barra de rolagem própria, que aparece ao rolar e some
   sozinha. Modelo do estúdio: o mesmo arquivo serve a site em HTML puro e a
   site em React. Só as cores mudam por projeto, e elas moram no CSS.

   POR QUE NÃO DÁ PARA FAZER ISSO COM A BARRA NATIVA
   A nativa não some sozinha no desktop, não aceita transição de opacidade, e
   as setinhas das pontas não podem ser removidas: assim que `scrollbar-width`
   recebe valor diferente de `auto`, o Chrome moderno passa a ignorar os
   pseudoelementos `::-webkit-scrollbar-button`. Medido na barra fina anterior:
   havia botão de 4px no topo (y=3 a 6) e outro na base. Então esta aqui é
   desenhada por nós.

   COMO SE COMPORTA
   - aparece ao rolar e some depois de 900ms parado;
   - aparece também quando o ponteiro chega perto da borda direita, e fica
     enquanto ele estiver ali, senão não haveria como agarrá-la;
   - arrasta com o mouse, e clicar no trilho salta uma tela;
   - sem setinha nenhuma, porque não desenhamos nenhuma.

   O QUE ACONTECE SE ISTO NÃO RODAR
   A classe `tem-js`, que esconde a barra nativa, é posta por um script no
   `<head>`. Sem JavaScript ela não entra e o visitante fica com a barra
   nativa de sempre. Nunca existe página sem forma de rolar.

   Só liga em ponteiro fino: no toque a barra nativa já se esconde sozinha e
   não há o que melhorar. */

(function () {
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

  var raiz = document.documentElement;
  var OCIOSO = 900;  /* ms parado até sumir */
  var PERTO = 34;    /* px da borda direita que revelam a barra */

  var barra = document.createElement('div');
  barra.className = 'barra-rolagem';
  barra.setAttribute('aria-hidden', 'true');

  var polegar = document.createElement('div');
  polegar.className = 'barra-rolagem__polegar';
  barra.appendChild(polegar);
  document.body.appendChild(barra);

  var alturaPolegar = 0, curso = 0, maxRolagem = 0;
  var visivel = false, arrastando = false, perto = false;
  var relogio = null, agendadoRolagem = false, agendadoPonteiro = false;

  function medir() {
    var janela = window.innerHeight;
    var doc = raiz.scrollHeight;
    maxRolagem = doc - janela;

    if (maxRolagem <= 1) {
      barra.classList.add('barra-rolagem--sem-uso');
      return;
    }
    barra.classList.remove('barra-rolagem--sem-uso');

    /* A conta é sobre a altura do TRILHO, não da janela: o trilho recua das
       duas pontas pelo CSS (--recuo), e usar innerHeight aqui faria o polegar
       passar do fim e ser cortado. Assim, mexer no recuo no CSS não exige
       tocar neste arquivo. */
    var trilho = barra.clientHeight || janela;

    /* mesma proporção da janela dentro do documento, com um piso para o
       polegar não virar um risco impossível de acertar em página muito longa */
    alturaPolegar = Math.max(48, Math.round(trilho * janela / doc));
    curso = trilho - alturaPolegar;
    polegar.style.height = alturaPolegar + 'px';
    posicionar();
  }

  function posicionar() {
    if (maxRolagem <= 1 || curso <= 0) return;
    var y = (window.scrollY / maxRolagem) * curso;
    /* translateY e não `top`: `top` recalcularia layout a cada quadro */
    polegar.style.transform = 'translateY(' + Math.round(y) + 'px)';
  }

  function mostrar() {
    if (barra.classList.contains('barra-rolagem--sem-uso')) return;
    if (!visivel) {
      visivel = true;
      barra.classList.add('barra-rolagem--visivel');
    }
    clearTimeout(relogio);
    if (!arrastando && !perto) relogio = setTimeout(esconder, OCIOSO);
  }

  function esconder() {
    if (arrastando || perto) return;
    visivel = false;
    barra.classList.remove('barra-rolagem--visivel');
  }

  window.addEventListener('scroll', function () {
    if (agendadoRolagem) return;
    agendadoRolagem = true;
    requestAnimationFrame(function () {
      agendadoRolagem = false;
      posicionar();
      mostrar();
    });
  }, { passive: true });

  window.addEventListener('mousemove', function (e) {
    if (agendadoPonteiro) return;
    agendadoPonteiro = true;
    var x = e.clientX;
    requestAnimationFrame(function () {
      agendadoPonteiro = false;
      var estaPerto = x >= window.innerWidth - PERTO;
      if (estaPerto === perto) return;
      perto = estaPerto;
      if (perto) mostrar();
      else {
        clearTimeout(relogio);
        relogio = setTimeout(esconder, OCIOSO);
      }
    });
  }, { passive: true });

  /* --- arrastar e clicar no trilho --------------------------------------- */

  function faixaDoPolegar() {
    var r = polegar.getBoundingClientRect();
    return { topo: r.top, base: r.bottom };
  }

  barra.addEventListener('pointerdown', function (e) {
    if (maxRolagem <= 1 || curso <= 0) return;
    e.preventDefault();

    var faixa = faixaDoPolegar();

    /* clique no trilho: salta uma tela na direção do clique, como a nativa */
    if (e.clientY < faixa.topo || e.clientY > faixa.base) {
      var passo = window.innerHeight * 0.9;
      var destino = e.clientY < faixa.topo ? window.scrollY - passo : window.scrollY + passo;
      window.scrollTo({ top: destino, behavior: 'smooth' });
      mostrar();
      return;
    }

    arrastando = true;
    barra.classList.add('barra-rolagem--arrastando');
    /* com ponteiro não ativo isto lança, e não pode derrubar o arrasto */
    try { barra.setPointerCapture(e.pointerId); } catch (erro) { /* segue sem captura */ }

    var yInicial = e.clientY;
    var rolagemInicial = window.scrollY;

    function mover(ev) {
      var delta = ev.clientY - yInicial;
      /* `behavior: instant` é obrigatório: a folha declara
         `html { scroll-behavior: smooth }`, e sem isto cada quadro do arrasto
         viraria uma animação, com o polegar patinando atrás do ponteiro. */
      window.scrollTo({
        top: rolagemInicial + (delta / curso) * maxRolagem,
        behavior: 'instant'
      });
    }

    function soltar(ev) {
      arrastando = false;
      barra.classList.remove('barra-rolagem--arrastando');
      try { barra.releasePointerCapture(ev.pointerId); } catch (erro) { /* ponteiro já solto */ }
      barra.removeEventListener('pointermove', mover);
      barra.removeEventListener('pointerup', soltar);
      barra.removeEventListener('pointercancel', soltar);
      mostrar();
    }

    barra.addEventListener('pointermove', mover);
    barra.addEventListener('pointerup', soltar);
    barra.addEventListener('pointercancel', soltar);
  });

  /* --- o documento muda de altura (foto que carrega, painel que abre) ----- */

  window.addEventListener('resize', medir);
  if (window.ResizeObserver) {
    new ResizeObserver(medir).observe(document.body);
  }
  window.addEventListener('load', medir);

  medir();
})();
