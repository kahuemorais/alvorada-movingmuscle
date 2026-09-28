import { redirect } from "next/navigation";
import { listCitySlugs } from "@/lib/city";
import { cityPath } from "@/lib/urls";

// The root is not a content page: traffic arrives from campaign per city, and the city page is the
// unit. So the root sends to the first published city, with no slug
// written in the code, so the list keeps being the data folder.
export default function Home() {
  const [first] = listCitySlugs();
  if (!first) throw new Error("nenhuma city publicada em src/data/cities");
  redirect(cityPath(first));
}
