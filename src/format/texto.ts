/** Para comparar o que foi digitado sem ligar para acento nem maiúscula ("joao" acha "João"). */
export const semAcento = (texto: string) => texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

const inteiro = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 });

/** 412380 → "412.380". */
export const formatarInteiro = (n: number) => inteiro.format(n);
