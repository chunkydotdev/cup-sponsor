import { CupsponsorApp } from "@/components/CupsponsorApp";
import { TODAY_SRC, listGallery } from "@/lib/media";
import { readSpot } from "@/lib/spot-server";

export const dynamic = "force-dynamic";

export default function Home() {
  // Read straight from the database so the cup arrives already wearing the
  // leader's logo, rather than flashing empty and filling in.
  return (
    <CupsponsorApp initialSpot={readSpot()} today={TODAY_SRC} past={listGallery()} />
  );
}
