import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Aparecer } from "@/components/Aparecer";
import Faq from "@/components/Faq";
import FinalCta from "@/components/FinalCta";
import Hero from "@/components/Hero";
import Simulator from "@/components/Simulator";
import SiteHeader from "@/components/SiteHeader";
import SocialProof from "@/components/SocialProof";
import Steps from "@/components/Steps";
import StructuredData from "@/components/StructuredData";
import { buscarCidadeOpcional, getCity, listCitySlugs } from "@/lib/city";
import { num, porcentoCheio } from "@/lib/format";
import { cityUrl } from "@/lib/urls";

// Uma rota para todas as cidades: o parametro e o slug, e a lista de caminhos sai da pasta de dados.
// Publicar a cidade numero 120 e soltar o arquivo dela em src/data/cities e refazer o build, sem
// tocar em codigo, que e o requisito de escala (cerca de 120 cidades).
export function generateStaticParams() {
  return listCitySlugs().map((city) => ({ city }));
}

// A pagina so existe para slug que tem arquivo: qualquer outro caminho cai em 404 de verdade, em vez
// de pagina vazia que o buscador indexa.
export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<{ city: string }> }): Promise<Metadata> {
  const { city } = await params;
  // Caminho seguro, e não o carregador direto: slug de forma inválida ou cidade sem arquivo devolve nulo
  // e a resposta é 404. Antes, este ponto lançava erro de renderização, porque era o único lugar que
  // chamava o carregador sem a conferência de lista que o corpo da página faz.
  const dados = buscarCidadeOpcional(city);
  if (!dados) notFound();
  // Sem barra no fim: e o endereco que a hospedagem serve, e canonical precisa ser o endereco
  // servido, nao um que redireciona.
  const url = cityUrl(dados.slug);

  // Title de 51 caracteres e description de 152, medidos: a kopy pede de 50 a 60 no title e de 150 a
  // 160 na description, e os dois estavam fora (47 e 171). A contagem de instalacoes entra com
  // separador de milhar, que e como o dado aparece na pagina.
  return {
    title: `Solar panel cost in ${dados.city}, ${dados.state} | Brightfield Solar`,
    description: `How many panels a ${dados.city} home needs, the price after the ${porcentoCheio(dados.federalCreditRate)} federal credit, and monthly savings. ${num(dados.installsCompleted)} installs completed with ${dados.utilityName}.`,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      url,
      siteName: "Brightfield Solar",
      title: `Solar panel cost in ${dados.city}, ${dados.state}`,
      description: `${num(dados.installsCompleted)} installs completed with ${dados.utilityName}. How many panels, the price after the credit, and the monthly savings.`,
    },
  };
}

export default async function CityPage({ params }: { params: Promise<{ city: string }> }) {
  const { city } = await params;
  if (!listCitySlugs().includes(city)) notFound();
  const dados = getCity(city);

  // Ordem dos blocos, e ela e a argumentacao da pagina: promessa, conta, como
  // acontece, quem faz, duvida, e a chamada final.
  return (
    <>
      {/* Âncora do item Home, e não o `main`. Um alvo com margem de rolagem faz o navegador parar antes
          do topo, que era o defeito relatado: o `main` tem margem porque é alvo de âncora de seção. Aqui
          a âncora é um elemento sem altura, no começo do documento, então o salto vai ao topo de verdade. */}
      <span id="topo" aria-hidden="true" />
      <SiteHeader marcaNoHero />
      {/* A abertura pega a largura toda da janela, então ela vive FORA do contêiner de 64 rem do `main` — dentro
          dele o bloco de tinta pararia antes das bordas. Quem reserva a altura da barra fixa no topo passa a ser a
          margem desta caixa, e não o respiro do `main`: o teste da abertura mede que ela começa logo abaixo da
          barra, com os cantos de cima retos. */}
      <div className="md:mt-[3.5rem]">
        <Hero city={dados} />
      </div>
      {/* O respiro de baixo reserva o espaço da barra fixa no celular. Com as faixas, quem dá o respiro
          vertical das seções é o `py-xxl` de cada uma, e a última faixa (o fecho, na cor de ação) reserva a
          barra por dentro dela: o `pb` do `main` deixou de existir, então a cor do fecho chega até o fim do
          documento em vez de deixar uma tira do fundo da página embaixo da faixa. */}
      <main>
        <StructuredData city={dados} />
        <Simulator city={dados} />
        <Aparecer>
          <Steps city={dados} />
        </Aparecer>
        <Aparecer>
          <SocialProof city={dados} />
        </Aparecer>
        <Aparecer>
          <Faq city={dados} />
        </Aparecer>
        <FinalCta city={dados} />
      </main>
    </>
  );
}
