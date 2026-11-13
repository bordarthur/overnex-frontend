// Requisitos da senha, mostrados enquanto a pessoa digita (mockup Login M2.0.0).
// Espelham a política de senha configurada no Supabase Auth: quem decide é a API, que recusa a senha
// fora da regra com um 400 e o texto pronto. Se a política mudar lá, mude aqui também.
export const REQUISITOS_SENHA = [
  { id: 'tamanho', rotulo: 'Pelo menos 8 caracteres', atende: (s: string) => s.length >= 8 },
  { id: 'maiuscula', rotulo: 'Uma letra maiúscula', atende: (s: string) => /[A-ZÀ-Ý]/.test(s) },
  { id: 'numero', rotulo: 'Um número', atende: (s: string) => /\d/.test(s) },
] as const;

export const atendeRequisitos = (senha: string) => REQUISITOS_SENHA.every((r) => r.atende(senha));
