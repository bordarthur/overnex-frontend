import { Pill } from '../../components/Pill';
import type { CargaDoCliente, FonteDoCliente } from '../../contracts/gestao';
import { formatarInteiro } from '../../format';

const SEM_VALOR = '–';

/** Aba "Prontidão dos dados": as tabelas do DW da empresa, que decidem o que pode ser ligado. */
export function AbaDados({ fontes }: { fontes: FonteDoCliente[] }) {
  return (
    <section className="gst-cartao" aria-labelledby="gst-dados-titulo">
      <h2 id="gst-dados-titulo">Tabelas do DW para esta empresa</h2>
      <p className="sub">
        Lido automaticamente depois da carga das 9h. É isso que decide o que pode ser ligado.
      </p>
      <div className="scroll-x">
        <table className="tbl gst-tbl">
          <thead>
            <tr>
              <th scope="col" className="l">
                Tabela
              </th>
              <th scope="col" className="l">
                Usada por
              </th>
              <th scope="col">Linhas</th>
              <th scope="col" className="l">
                Última data
              </th>
              <th scope="col" className="l">
                Status
              </th>
              <th scope="col" className="l">
                Observação
              </th>
            </tr>
          </thead>
          <tbody>
            {fontes.map((f) => (
              <tr key={f.tabela}>
                <td className="l forte">{f.tabela}</td>
                <td className="l">{f.usadaPor.join(', ')}</td>
                <td>{f.linhas == null ? SEM_VALOR : formatarInteiro(f.linhas)}</td>
                <td className="l">{f.ultimaData ?? SEM_VALOR}</td>
                <td className="l">
                  <Pill status={f.status} rotulo={f.statusRotulo} />
                </td>
                <td className="l">{f.observacao}</td>
              </tr>
            ))}
            {fontes.length === 0 && (
              <tr>
                <td colSpan={6} className="l gst-vazio">
                  Nenhuma tabela cadastrada para esta empresa.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

/** Aba "Cargas": as últimas cópias do DW para o banco do app. */
export function AbaCargas({ cargas }: { cargas: CargaDoCliente[] }) {
  return (
    <section className="gst-cartao" aria-labelledby="gst-cargas-titulo">
      <h2 id="gst-cargas-titulo">Últimas cargas</h2>
      <p className="sub">Cópia do DW para o banco do app, todo dia às 9h</p>
      <div className="scroll-x">
        <table className="tbl gst-tbl">
          <thead>
            <tr>
              <th scope="col" className="l">
                Data
              </th>
              <th scope="col" className="l">
                Início
              </th>
              <th scope="col" className="l">
                Duração
              </th>
              <th scope="col">Tabelas</th>
              <th scope="col" className="l">
                Status
              </th>
              <th scope="col" className="l">
                Observação
              </th>
            </tr>
          </thead>
          <tbody>
            {cargas.map((c) => (
              <tr key={`${c.data} ${c.inicio}`}>
                <td className="l">{c.data}</td>
                <td className="l">{c.inicio}</td>
                <td className="l">{c.duracao ?? SEM_VALOR}</td>
                <td>{c.tabelas}</td>
                <td className="l">
                  <Pill status={c.status} rotulo={c.statusRotulo} />
                </td>
                <td className="l">{c.observacao}</td>
              </tr>
            ))}
            {cargas.length === 0 && (
              <tr>
                <td colSpan={6} className="l gst-vazio">
                  Esta empresa ainda não teve carga.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
