// Datas mostradas no horário de Brasília, independente do fuso de quem abre o painel.
const FUSO = 'America/Sao_Paulo';

const partesFmt = new Intl.DateTimeFormat('pt-BR', {
  timeZone: FUSO,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

interface Partes {
  ano: string;
  mes: string;
  dia: string;
  hora: number;
  minuto: number;
}

function partes(d: Date): Partes {
  const p = Object.fromEntries(partesFmt.formatToParts(d).map((x) => [x.type, x.value]));
  return {
    ano: p.year ?? '',
    mes: p.month ?? '',
    dia: p.day ?? '',
    hora: Number(p.hour),
    minuto: Number(p.minute),
  };
}

const chaveDia = (p: Pick<Partes, 'ano' | 'mes' | 'dia'>) => `${p.ano}-${p.mes}-${p.dia}`;

/** "2026-10-12" → "12/10". A data vem sem hora, então não passa por fuso. */
export function formatarDiaMes(dataIso: string): string {
  const [, mes, dia] = dataIso.slice(0, 10).split('-');
  return `${dia}/${mes}`;
}

const hora = (p: Partes) => (p.minuto ? `${p.hora}h${String(p.minuto).padStart(2, '0')}` : `${p.hora}h`);

/** "Dados até 12/10, atualizados hoje às 9h" ("ontem", ou "em 13/10" quando for mais antigo). */
export function formatarAtualizacao(
  dadosAte: string,
  atualizadoEm: string,
  agora: Date = new Date(),
): string {
  const carga = partes(new Date(atualizadoEm));
  const hoje = partes(agora);
  const ontemUtc = new Date(Date.UTC(Number(hoje.ano), Number(hoje.mes) - 1, Number(hoje.dia) - 1));
  const ontem = {
    ano: String(ontemUtc.getUTCFullYear()),
    mes: String(ontemUtc.getUTCMonth() + 1).padStart(2, '0'),
    dia: String(ontemUtc.getUTCDate()).padStart(2, '0'),
  };
  const dia =
    chaveDia(carga) === chaveDia(hoje)
      ? 'hoje'
      : chaveDia(carga) === chaveDia(ontem)
        ? 'ontem'
        : `em ${carga.dia}/${carga.mes}`;
  return `Dados até ${formatarDiaMes(dadosAte)}, atualizados ${dia} às ${carga.hora}h`;
}

/** "13/10/2026 às 9h02", para o rodapé. */
export function formatarDataHora(iso: string): string {
  const p = partes(new Date(iso));
  return `${p.dia}/${p.mes}/${p.ano} às ${hora(p)}`;
}
