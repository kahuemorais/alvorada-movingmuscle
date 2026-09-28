import { redirect } from "next/navigation";
import { listCitySlugs } from "@/lib/city";
import { cityPath } from "@/lib/urls";

// A raiz nao e pagina de conteudo: o trafego chega de campanha por cidade, e a pagina de cidade e a
// unidade. Entao a raiz manda para a primeira cidade publicada, sem slug
// escrito no codigo, para a lista continuar sendo a pasta de dados.
export default function Home() {
  const [primeira] = listCitySlugs();
  if (!primeira) throw new Error("nenhuma cidade publicada em src/data/cities");
  redirect(cityPath(primeira));
}
