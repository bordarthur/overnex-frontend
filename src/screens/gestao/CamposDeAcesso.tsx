import { Logotipo } from '../../components/Marca';
import { OpcaoCartao } from '../../components/OpcaoCartao';
import { Segmentado } from '../../components/Segmentado';
import type { GestaoPayload, ItemCliente } from '../../contracts/gestao';
import { sessoesDoPerfil, type CamposDeAcessoDoFormulario } from './apoio';

interface Props {
  /** prefixo dos ids dos campos */
  id: string;
  /** os perfis, as empresas e as opções de sessão */
  gestao: GestaoPayload;
  /** o estado do formulário, de `useCamposDeAcesso` */
  campos: CamposDeAcessoDoFormulario;
  /** falta escolher o perfil (no convite) */
  erroPerfil?: string;
}

// Quantas empresas cabem na prévia da tela "Escolha a empresa".
const EMPRESAS_NA_PREVIA = 4;

/**
 * Os campos de acesso de uma pessoa, iguais na edição e no convite: perfil, empresas, a prévia do que
 * ela vê ao entrar e o tempo de sessão (que só aparece com o perfil escolhido).
 */
export function CamposDeAcesso({ id, gestao, campos, erroPerfil }: Props) {
  const { perfil, sessao, admin, empresas, marcadas } = campos;
  const opcoesSessao = sessoesDoPerfil(gestao.sessoes, perfil).map((s) => ({
    id: String(s.minutos),
    rotulo: s.rotulo,
  }));

  return (
    <>
      <fieldset className="gst-campo">
        <legend>Perfil</legend>
        <div className="gst-opcoes">
          {gestao.perfis.map((p) => (
            <OpcaoCartao
              key={p.id}
              tipo="radio"
              nome={`${id}-perfil`}
              titulo={p.rotulo}
              descricao={p.descricao}
              marcada={p.id === perfil}
              onMudar={() => campos.trocarPerfil(p.id)}
            />
          ))}
        </div>
        {erroPerfil && (
          <span className="gst-campo-erro" role="alert">
            {erroPerfil}
          </span>
        )}
      </fieldset>
      <fieldset className="gst-campo">
        <legend>Empresas</legend>
        {admin ? (
          <p className="gst-dica">Admin BORD vê todas as empresas. Não precisa de vínculo.</p>
        ) : (
          <>
            <div className="gst-opcoes">
              {gestao.clientes.map((c) => (
                <OpcaoCartao
                  key={c.slug}
                  tipo="checkbox"
                  titulo={c.nome}
                  marcada={empresas.has(c.slug)}
                  onMudar={(marcada) => campos.marcarEmpresa(c.slug, marcada)}
                />
              ))}
            </div>
            {marcadas.length === 0 && (
              <p className="gst-aviso-campo" role="status">
                Sem empresa, a pessoa entra e não vê nada. Marque pelo menos uma.
              </p>
            )}
          </>
        )}
      </fieldset>
      <div className="gst-campo">
        <span className="gst-rotulo">Ao entrar, a pessoa vê</span>
        <PreviaAoEntrar admin={admin} marcadas={marcadas} todas={gestao.clientes} />
      </div>
      {sessao !== null && (
        <fieldset className="gst-campo">
          <legend>A sessão cai após</legend>
          <Segmentado
            rotulo="A sessão cai após"
            opcoes={opcoesSessao}
            valor={String(sessao)}
            onMudar={(minutos) => campos.setSessao(Number(minutos))}
          />
          <span className="gst-dica">
            Tempo sem mexer na tela; o aviso aparece 2 minutos antes. Para a Visão geral aberta na TV, use 4 h
            ou mais. Mais de 12 h, só Admin BORD.
          </span>
        </fieldset>
      )}
    </>
  );
}

interface PropsPrevia {
  admin: boolean;
  marcadas: ItemCliente[];
  todas: ItemCliente[];
}

/**
 * Prévia do que a pessoa vê logo depois de entrar, com o que está marcado no formulário (ainda não
 * gravado). É a mesma regra da entrada do app (Inicio, em Guardas.tsx): Admin BORD abre a Gestão;
 * uma empresa abre direto; duas ou mais, a tela de escolha; nenhuma, o aviso.
 */
function PreviaAoEntrar({ admin, marcadas, todas }: PropsPrevia) {
  const lista = admin ? todas : marcadas;
  let titulo: string;
  let texto: string;
  if (admin) {
    titulo = 'Gestão';
    texto = `Abre a Gestão e escolhe entre as ${todas.length} empresas.`;
  } else if (marcadas.length === 0) {
    titulo = 'Sua conta ainda não tem empresa';
    texto = 'Não vê nada.';
  } else if (marcadas.length === 1) {
    titulo = 'Visão geral';
    texto = `Abre direto em ${marcadas[0]!.nome}.`;
  } else {
    titulo = 'Escolha a empresa';
    texto = `Escolhe entre ${marcadas.length} empresas. Depois, troca de empresa pelo menu.`;
  }
  const resto = lista.length - EMPRESAS_NA_PREVIA;

  return (
    <div className="gst-previa-entrar">
      {/* miniatura decorativa da tela; o texto ao lado diz a mesma coisa */}
      <div className="gst-mini" aria-hidden="true">
        <div className="gst-mini-barra">
          <Logotipo className="gst-mini-logo" />
        </div>
        <div className="gst-mini-corpo">
          <b>{titulo}</b>
          {!admin && marcadas.length === 0 && <span>Fale com a BORD para liberar o acesso.</span>}
          {!admin && marcadas.length === 1 && (
            <>
              <span>{marcadas[0]!.nome}</span>
              <i />
              <i />
              <i className="curta" />
            </>
          )}
          {(admin || marcadas.length > 1) && (
            <>
              {lista.slice(0, EMPRESAS_NA_PREVIA).map((c) => (
                <span key={c.slug} className="gst-mini-item">
                  {c.nome}
                </span>
              ))}
              {resto > 0 && <span>e mais {resto}</span>}
            </>
          )}
        </div>
      </div>
      <span className="gst-dica" role="status">
        {texto}
      </span>
    </div>
  );
}
