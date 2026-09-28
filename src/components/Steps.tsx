/* eslint-disable @next/next/no-img-element */
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { City } from "@/lib/city";
import { num } from "@/lib/format";
import { IconeChave, IconeConexao, IconeDocumento } from "@/components/icons";

// Terceiro bloco: como a instalacao acontece, em tres passos. O primeiro passo carrega o numero do
// dado (licenca media da cidade) em vez de texto generico, porque e a duvida real de quem espera.
//
// A pagina estava parada, e este bloco ganhou a sobrancelha em cima do titulo: a linha diz "isto e uma
// sequencia de tres", que e o que o bloco significa, e os tres cartoes entram escalonados, 60 ms entre um e outro.
// A trilha que crescia da esquerda para a direita abaixo do titulo saiu.
export default function Steps({ city }: { city: City }) {
  const passos = [
    {
      titulo: "Permit",
      icone: <IconeDocumento />,
      tempo: `${num(city.avgPermitDays)} days, on average`,
      texto: `${city.city} reviews the plan and issues the permit. Brightfield files it for you, and the average wait here is ${num(city.avgPermitDays)} days.`,
      foto: "/fotos/tecnico-no-telhado.avif",
      alt: "A technician working on installed panels on a roof",
      largura: 1170,
      altura: 780,
    },
    {
      titulo: "Installation",
      icone: <IconeChave />,
      tempo: "One day",
      texto:
        "The crew mounts the rails, sets the panels and photographs every roof penetration. Most homes are done in a single day.",
      foto: "/fotos/trilho-no-telhado.avif",
      alt: "Mounting rails being installed on a roof",
      largura: 1600,
      altura: 1074,
    },
    {
      titulo: "Interconnection",
      icone: <IconeConexao />,
      tempo: "A week or two",
      texto: `${city.utilityName} swaps the meter and approves the connection. From that day on, your production is credited against your bill.`,
      foto: "/fotos/paineis-no-campo.avif",
      alt: "Rows of installed solar panels, seen from above",
      largura: 1170,
      altura: 780,
    },
  ];

  return (
    // Faixa 2: `surface`, a faixa branca inteira. O fundo é da seção, com respiro vertical próprio, e o conteúdo
    // vive na coluna de 64 rem por dentro dela.
    <section id="steps" aria-labelledby="steps-title" className="w-full bg-surface py-xxl">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-lg px-lg">
      {/* Sobrancelha: filete na cor do próprio rótulo, com rótulo curto. E o enfeite que dá hierarquia à seção, e o
          rótulo é contagem ("três passos"), não frase nova. */}
      <p className="flex items-center gap-sm type-label text-support">
        <span aria-hidden className="h-px w-xl bg-support" />
        Three steps
      </p>
      <h2 id="steps-title" className="type-title text-ink md:max-w-[54rem]">
        From signed quote to switched-on meter
      </h2>
      {/* A trilha que cruzava a seção abaixo do título (linha neutra com o trecho na cor de ação que crescia
          quando a seção entrava) saiu. Ela existia para dizer "isto é uma sequência", que os
          três cartões numerados já dizem; sem ela o título é o que a seção mostra antes dos passos. */}
      {/* A foto do serviço entrou para DENTRO dos cartões: uma por passo, no passo que ela mostra, o
          técnico no passo 1, o trilho no 2, os painéis no 3. Antes era uma faixa solta acima dos três. As três
          são `img` e não o otimizador do Next, pelo mesmo motivo das outras: o
          arquivo já está em AVIF e otimizado. */}
      <ol className="grid gap-md md:grid-cols-3">
        {passos.map((passo, indice) => (
          <li key={passo.titulo} className="ecoar sobe" style={{ animationDelay: `${indice * 60}ms` }}>
            <Card className="h-full">
              <CardHeader>
                {/* O ícone ganhou fundo azul claro e o rótulo do passo entrou no azul. O azul entrou em
                    "Step 2" e "Step 3" e o fundo claro atrás de cada ícone; os três rótulos ficaram iguais porque
                    "Step 1" cinza ao lado de dois azuis lê como esquecimento, e não como hierarquia. */}
                <p className="flex items-center gap-sm type-label text-ink">
                  {/* Círculo escuro atrás do ícone dourado: dourado sobre fundo claro não
                      dava contraste para identificar o desenho. O preto usado (#1A1A1A) é a tinta que a página já
                      tem (ink, #16181A, quatro pontos de diferença no canal vermelho), então vale o token em vez
                      de um segundo quase-preto no tema. O ícone mantém o tamanho; o que cresceu foi o círculo. */}
                  <span className="flex size-9 items-center justify-center rounded-full bg-ink text-primary-light">
                    {passo.icone}
                  </span>
                  Step {indice + 1}
                </p>
                <CardTitle className="type-title text-ink">{passo.titulo}</CardTitle>
                <p className="type-label text-ink">{passo.tempo}</p>
              </CardHeader>
              <CardContent className="flex flex-col gap-md">
                {/* Teto de altura também no compacto: sem ele, o `aspect-[4/3]` com `w-full` dava 233 px de
                    altura por foto numa coluna de 390 px, e a foto esticava o cartão do passo. O
                    `md:max-h-[11rem]` do desktop continua como estava; aqui o teto é 10 rem, e o
                    `object-cover` recorta o que passa. */}
                <img
                  src={passo.foto}
                  alt={passo.alt}
                  width={passo.largura}
                  height={passo.altura}
                  loading="lazy"
                  decoding="async"
                  className="aspect-[4/3] w-full max-h-[10rem] rounded-md border border-outline object-cover md:aspect-auto md:max-h-[11rem]"
                />
                <p className="type-body text-support">{passo.texto}</p>
              </CardContent>
            </Card>
          </li>
        ))}
      </ol>
      </div>
    </section>
  );
}
