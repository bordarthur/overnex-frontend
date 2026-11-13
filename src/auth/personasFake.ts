// SÓ PARA DESENVOLVIMENTO: quem é a pessoa do login fake. O e-mail digitado escolhe a pessoa, e o
// token `fake:<object_id>` leva essa escolha para a API local (que tem as mesmas pessoas no seed) e
// para o mock (src/api/mockGestao.ts).

/** O usuário de desenvolvimento do back (diretoria@lannconsult.com.br, PJ Cortes): uma empresa só. */
export const OBJECT_ID_PADRAO =
  import.meta.env.VITE_AUTH_FAKE_OBJECT_ID || '0d000000-0000-4000-8000-0000000001a1';

export type PersonaFake = 'cliente' | 'admin' | 'consultor' | 'sem-empresa';

interface DadosPersona {
  /** `object_id` do token fake. Dora e Caio existem no seed local do back; a conta sem empresa, só no mock. */
  objectId: string;
  nome: string;
  /** Tempo de sessão parada do perfil, como a API devolve em `inatividadeSegundos`. */
  inatividadeSegundos: number;
}

const HORA = 3600;

export const PERSONAS_FAKE: Record<PersonaFake, DadosPersona> = {
  cliente: { objectId: OBJECT_ID_PADRAO, nome: 'Usuário de desenvolvimento', inatividadeSegundos: 4 * HORA },
  admin: { objectId: '0d000000-0000-4000-8000-0000000000ad', nome: 'Dora', inatividadeSegundos: 24 * HORA },
  consultor: {
    objectId: '0d000000-0000-4000-8000-0000000000c0',
    nome: 'Caio',
    inatividadeSegundos: 8 * HORA,
  },
  'sem-empresa': {
    objectId: '0d000000-0000-4000-8000-0000000000e0',
    nome: 'Joana',
    inatividadeSegundos: 4 * HORA,
  },
};

// Começo do e-mail → pessoa. Qualquer outro e-mail é o usuário de desenvolvimento.
const POR_EMAIL: [string, PersonaFake][] = [
  ['dora', 'admin'],
  ['caio', 'consultor'],
  ['joana', 'sem-empresa'],
];

/** "dora@…" entra como Admin BORD, "caio@…" como consultor com duas empresas e "joana@…" sem empresa. */
export function personaDoEmail(email: string): PersonaFake {
  const inicio = email.trim().toLowerCase();
  return POR_EMAIL.find(([prefixo]) => inicio.startsWith(prefixo))?.[1] ?? 'cliente';
}

/** A pessoa de um token `fake:<object_id>`. Token de verdade (ou nenhum) cai no usuário de desenvolvimento. */
export function personaDoToken(token: string | null): PersonaFake {
  const objectId = token?.startsWith('fake:') ? token.slice(5) : null;
  const achada = (Object.keys(PERSONAS_FAKE) as PersonaFake[]).find(
    // a ordem importa: com VITE_AUTH_FAKE_OBJECT_ID igual ao da Dora, o padrão é ela
    (p) => p !== 'cliente' && PERSONAS_FAKE[p].objectId === objectId,
  );
  return achada ?? 'cliente';
}
