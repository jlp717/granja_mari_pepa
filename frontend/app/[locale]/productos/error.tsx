"use client";
import Link from "next/link";
import { useLocale } from "next-intl";
import { getCatalogueStateCopy } from "@/components/kage/catalogue/state-copy";
export default function CatalogueError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const locale = useLocale();
  const copy = getCatalogueStateCopy(locale);
  return (
    <section className="sec" role="alert" data-fx="x-error-feedback">
      <h1 className="display h-sec">{copy.errorTitle}</h1>
      <p className="body-lg">{copy.error}</p>
      <button className="cta" onClick={reset}>
        {copy.retry}
      </button>
      <Link className="arrowlink" href={"/" + locale + "/contacto"}>
        {copy.contact}
      </Link>
    </section>
  );
}
