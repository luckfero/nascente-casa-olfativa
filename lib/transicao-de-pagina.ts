/**
 * Abre a transição de página e trata o pulo.
 *
 * O navegador pula uma View Transition em três casos, e em todos rejeita a
 * promessa `ready` com uma DOMException: outra transição começou antes de
 * esta terminar (`AbortError`, que é o clique duplo num link, comum no
 * celular), a foto da tela não pôde ser tirada (`InvalidStateError`) ou o
 * callback demorou demais (`TimeoutError`). Medido em 21/10/2026 no Chromium
 * e no WebKit: no pulo só a `ready` rejeita; o callback da transição pulada
 * roda até o fim, então a troca de página acontece igual, e
 * `updateCallbackDone` e `finished` resolvem. Ninguém olhava a `ready`, e
 * cada pulo virava "Uncaught (in promise) AbortError" no console.
 *
 * Pulo não é erro, é a animação que não acontece, e só ele é engolido. Se o
 * callback falhar de verdade, as três promessas rejeitam com o erro dele, e
 * esse erro continua aparecendo no console.
 *
 * Fica fora do componente para o teste alcançar sem navegador
 * (`tests/rendered-html.test.mjs`). É a mesma função da Nívora, que tem o
 * mesmo componente de transição.
 */
const MOTIVOS_DE_PULO = new Set(["AbortError", "InvalidStateError", "TimeoutError"]);

export function ignorarPulo(motivo: unknown): void {
  if (motivo instanceof DOMException && MOTIVOS_DE_PULO.has(motivo.name)) return;
  throw motivo;
}

interface ComTransicao {
  startViewTransition(atualizar: () => Promise<void>): ViewTransition;
}

export function abrirTransicao(documento: ComTransicao, atualizar: () => Promise<void>): ViewTransition {
  const transicao = documento.startViewTransition(atualizar);
  transicao.ready.catch(ignorarPulo);
  return transicao;
}
