import { Link, useLocation } from 'react-router';
import { useClienteSlug } from '../../api/useClienteSlug';
import { useSessao } from '../../api/useSessao';
import type { LinkTela } from '../../contracts/painel';
import { CODIGO_DA_TELA, ehTelaApp } from '../../contracts/telas';

/**
 * Atalho para outra tela da empresa ("Comprar →"). Só aparece se a tela existe no front e está
 * liberada à pessoa (`telas` da sessão): o Compras, por exemplo, ainda não existe. Leva junto a
 * escolha de Negócios (`?unidades=`).
 */
export function LinkParaTela({ link, className = 'link' }: { link: LinkTela; className?: string }) {
  const cliente = useClienteSlug();
  const { search } = useLocation();
  const telas = useSessao().data?.telas;
  if (!ehTelaApp(link.tela) || !telas?.includes(CODIGO_DA_TELA[link.tela])) return null;
  return (
    <Link className={className} to={{ pathname: `/${cliente}/${link.tela}`, search }}>
      {link.rotulo}
    </Link>
  );
}
