import { useId, useState } from 'react';
import { useGravarGestao } from '../../api/useGestao';
import { Gaveta } from '../../components/Gaveta';
import { Logotipo } from '../../components/Marca';
import { OpcaoCartao } from '../../components/OpcaoCartao';
import { Segmentado } from '../../components/Segmentado';
import type { GestaoPayload, ItemCliente, UsuarioGestao } from '../../contracts/gestao';
import { PERFIL_ADMIN } from '../../contracts/sessao';
import { erroDaGravacao, sessoesDoPerfil } from './apoio';
import './GavetaUsuario.css';

interface Props {
  usuario: UsuarioGestao;
  /** os perfis, as empresas e as opções de sessão */
  gestao: GestaoPayload;
  onFechar: () => void;
}

// Quantas empresas cabem na prévia da tela "Escolha a empresa".
const EMPRESAS_NA_PREVIA = 4;

/**
 * Gaveta de edição de quem já tem acesso: nome, perfil, empresas e sessão, e desativar ou reativar o
 * acesso. O convite de gente nova não é aqui (o cadastro de login é por comando da BORD).
 * As regras são da API, que devolve o texto pronto quando recusa; a tela só as reflete: o perfil
 * Admin BORD não tem lista de empresas, e trocar de perfil volta a sessão para o padrão dele.
 * Use com `key={usuario.id}`.
 */
export function GavetaUsuario({ usuario, gestao, onFechar }: Props) {
  const id = useId();
  const [nome, setNome] = useState(usuario.nome);
  const [perfil, setPerfil] = useState(usuario.perfil.id);
  const [empresas, setEmpresas] = useState(() => new Set(usuario.clientes.map((c) => c.slug)));
  const [sessao, setSessao] = useState(usuario.sessaoMinutos);
  const [semNome, setSemNome] = useState(false);
  const [reativado, setReativado] = useState(false);

  const salvar = useGravarGestao(
    (api, m: { nome: string; perfil: string; clientes: string[]; sessaoMinutos: number }) =>
      api.salvarUsuario(usuario.id, m),
    'acesso',
  );
  const acesso = useGravarGestao(
    (api, ativo: boolean) => api.salvarAcessoDoUsuario(usuario.id, ativo),
    'acesso',
  );
  const gravando = salvar.isPending || acesso.isPending;
  const erro = salvar.isError ? salvar.error : acesso.isError ? acesso.error : null;

  const admin = perfil === PERFIL_ADMIN;
  const marcadas = gestao.clientes.filter((c) => empresas.has(c.slug));
  const opcoesSessao = sessoesDoPerfil(gestao.sessoes, perfil).map((s) => ({
    id: String(s.minutos),
    rotulo: s.rotulo,
  }));
  const inativo = usuario.situacao.id === 'inativo';

  const trocarPerfil = (novo: string) => {
    setPerfil(novo);
    // a sessão volta para o padrão do perfil escolhido
    const padrao = gestao.perfis.find((p) => p.id === novo)?.sessaoPadraoMinutos;
    if (padrao !== undefined) setSessao(padrao);
    if (novo === PERFIL_ADMIN) setEmpresas(new Set());
  };
  const marcarEmpresa = (slug: string, marcada: boolean) =>
    setEmpresas((atual) => {
      const novo = new Set(atual);
      if (marcada) novo.add(slug);
      else novo.delete(slug);
      return novo;
    });
  const aoSalvar = () => {
    if (!nome.trim()) return setSemNome(true);
    acesso.reset();
    salvar.mutate(
      {
        nome: nome.trim(),
        perfil,
        clientes: admin ? [] : marcadas.map((c) => c.slug),
        sessaoMinutos: sessao,
      },
      { onSuccess: onFechar },
    );
  };
  const mudarAcesso = (ativo: boolean) => {
    salvar.reset();
    setReativado(false);
    // desativar fecha a gaveta; reativar fica, com o aviso
    acesso.mutate(ativo, { onSuccess: ativo ? () => setReativado(true) : onFechar });
  };

  return (
    <Gaveta
      titulo={usuario.nome}
      onFechar={onFechar}
      rodape={
        <>
          {erro && (
            <p className="gst-erro gst-gaveta-erro" role="alert">
              {erroDaGravacao(erro)}
            </p>
          )}
          <span className="gst-gaveta-acesso">
            {inativo ? (
              <button type="button" className="link" disabled={gravando} onClick={() => mudarAcesso(true)}>
                Reativar acesso
              </button>
            ) : (
              usuario.podeDesativar && (
                <button
                  type="button"
                  className="link perigo"
                  disabled={gravando}
                  onClick={() => mudarAcesso(false)}
                >
                  Desativar acesso
                </button>
              )
            )}
          </span>
          <button type="button" className="btn fantasma" onClick={onFechar}>
            Cancelar
          </button>
          <button type="button" className="btn" disabled={gravando} onClick={aoSalvar}>
            Salvar alterações
          </button>
        </>
      }
    >
      {reativado && (
        <p className="gst-ok" role="status">
          Acesso reativado.
        </p>
      )}
      <div className="gst-campo">
        <label htmlFor={`${id}-email`}>E-mail</label>
        <input
          id={`${id}-email`}
          type="email"
          value={usuario.email}
          disabled
          aria-describedby={`${id}-email-dica`}
        />
        <span id={`${id}-email-dica`} className="gst-dica">
          O e-mail é o login. Para trocar, convide o novo e desative este.
        </span>
      </div>
      <div className="gst-campo">
        <label htmlFor={`${id}-nome`}>Nome</label>
        <input
          id={`${id}-nome`}
          type="text"
          autoComplete="off"
          maxLength={120}
          value={nome}
          aria-invalid={semNome || undefined}
          aria-describedby={semNome ? `${id}-nome-erro` : undefined}
          onChange={(e) => {
            setNome(e.target.value);
            setSemNome(false);
          }}
        />
        {semNome && (
          <span id={`${id}-nome-erro`} className="gst-campo-erro" role="alert">
            Informe o nome.
          </span>
        )}
      </div>
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
              onMudar={() => trocarPerfil(p.id)}
            />
          ))}
        </div>
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
                  onMudar={(marcada) => marcarEmpresa(c.slug, marcada)}
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
      <fieldset className="gst-campo">
        <legend>A sessão cai após</legend>
        <Segmentado
          rotulo="A sessão cai após"
          opcoes={opcoesSessao}
          valor={String(sessao)}
          onMudar={(minutos) => setSessao(Number(minutos))}
        />
        <span className="gst-dica">
          Tempo sem mexer na tela; o aviso aparece 2 minutos antes. Para a Visão geral aberta na TV, use 4 h
          ou mais. Mais de 12 h, só Admin BORD.
        </span>
      </fieldset>
      <div className="gst-campo">
        <span className="gst-rotulo">Registro de acessos</span>
        {usuario.acessos.ultimo ? (
          <div className="gst-acessos">
            <span>
              <b>{usuario.acessos.entradas30d}</b> entradas em 30 dias
            </span>
            <span>
              Último acesso: <b>{usuario.acessos.ultimo}</b>
            </span>
          </div>
        ) : (
          <div className="gst-acessos">Ainda não entrou.</div>
        )}
      </div>
    </Gaveta>
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
