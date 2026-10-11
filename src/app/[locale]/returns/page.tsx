import { Link } from "@/i18n/navigation";
import { ReturnRequestForm } from "@/components/returns/return-request-form";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Suspense } from "react";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Returns" });
  return {
    title: t("title"),
    description: t("metaDescription"),
  };
}

export default async function ReturnsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Returns");

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <div id="top" className="scroll-mt-28" />
      <h1 className="font-display text-4xl font-bold tracking-tight">
        {t("title")}
      </h1>
      <p className="mt-3 text-sm text-muted-foreground">{t("pageIntro")}</p>

      <nav
        className="sticky top-16 z-20 mt-8 -mx-4 flex gap-1 overflow-x-auto border-y border-border bg-[#f7f6f3]/95 px-4 py-2 backdrop-blur-sm sm:mx-0 sm:px-0"
        aria-label={t("pageNav")}
      >
        <a
          href="#dostavka"
          className="shrink-0 px-3 py-2 text-[11px] tracking-[0.14em] text-muted-foreground uppercase transition hover:text-foreground"
        >
          {t("navDelivery")}
        </a>
        <a
          href="#povernennya"
          className="shrink-0 px-3 py-2 text-[11px] tracking-[0.14em] text-muted-foreground uppercase transition hover:text-foreground"
        >
          {t("navReturns")}
        </a>
        <a
          href="#zayavka"
          className="shrink-0 bg-ink px-3 py-2 text-[11px] tracking-[0.14em] text-mist uppercase"
        >
          {t("navForm")}
        </a>
      </nav>

      <div className="mt-8 rounded-none border border-border bg-white p-5 sm:p-6">
        <p className="text-sm leading-relaxed text-muted-foreground">
          {t("formTeaser")}
        </p>
        <a
          href="#zayavka"
          className="mt-4 inline-flex border border-ink bg-ink px-4 py-2.5 text-[11px] tracking-[0.14em] text-mist uppercase transition hover:opacity-90"
        >
          {t("navForm")}
        </a>
      </div>

      <div className="mt-12 space-y-10 text-muted-foreground">
        <section id="dostavka" className="scroll-mt-28 space-y-10">
          <div>
            <h2 className="text-lg font-semibold tracking-wide text-foreground uppercase">
              {t("ordersTitle")}
            </h2>
            <p className="mt-3 leading-relaxed">{t("ordersBody")}</p>
          </div>

          <div>
            <h2 className="text-lg font-semibold tracking-wide text-foreground uppercase">
              {t("uaTitle")}
            </h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 leading-relaxed">
              <li>
                {t.rich("uaCarrier", {
                  carrier: (chunks) => (
                    <strong className="text-foreground">{chunks}</strong>
                  ),
                })}
              </li>
              <li>
                {t.rich("uaTime", {
                  days: (chunks) => (
                    <strong className="text-foreground">{chunks}</strong>
                  ),
                })}
              </li>
              <li>{t("uaShip")}</li>
            </ul>
          </div>

          <div>
            <h2 className="text-lg font-semibold tracking-wide text-foreground uppercase">
              {t("intlTitle")}
            </h2>
            <p className="mt-3 leading-relaxed">
              {t.rich("intlBody", {
                handle: (chunks) => (
                  <a
                    href="https://www.instagram.com/blancoone/"
                    className="text-foreground underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {chunks}
                  </a>
                ),
              })}
            </p>
          </div>
        </section>

        <section id="povernennya" className="scroll-mt-28 space-y-10">
          <div>
            <h2 className="text-lg font-semibold tracking-wide text-foreground uppercase">
              {t("defectiveTitle")}
            </h2>
            <p className="mt-3 leading-relaxed">{t("defectiveBody")}</p>
          </div>

          <div>
            <h2 className="text-lg font-semibold tracking-wide text-foreground uppercase">
              {t("qualityTitle")}
            </h2>
            <p className="mt-3 leading-relaxed">
              {t.rich("qualityBody", {
                days: (chunks) => (
                  <strong className="text-foreground">{chunks}</strong>
                ),
              })}
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold tracking-wide text-foreground uppercase">
              {t("conditionsTitle")}
            </h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 leading-relaxed">
              <li>{t("condition1")}</li>
              <li>{t("condition2")}</li>
              <li>{t("condition3")}</li>
            </ul>
            <p className="mt-3 text-sm leading-relaxed">{t("excludedNote")}</p>
          </div>

          <div>
            <h2 className="text-lg font-semibold tracking-wide text-foreground uppercase">
              {t("whatToDoTitle")}
            </h2>
            <ol className="mt-3 list-decimal space-y-2 pl-5 leading-relaxed">
              <li>{t("whatToDo1")}</li>
              <li>{t("whatToDo2")}</li>
              <li>{t("whatToDo3")}</li>
              <li>{t("whatToDo4")}</li>
            </ol>
          </div>

          <div>
            <h2 className="text-lg font-semibold tracking-wide text-foreground uppercase">
              {t("compensationTitle")}
            </h2>
            <p className="mt-3 leading-relaxed">{t("compensationBody")}</p>
            <p className="mt-3 leading-relaxed">{t("returnCost")}</p>
          </div>

          <div>
            <h2 className="text-lg font-semibold tracking-wide text-foreground uppercase">
              {t("exchangeTitle")}
            </h2>
            <p className="mt-3 leading-relaxed">{t("exchangeBody")}</p>
          </div>
        </section>

        <Suspense
          fallback={
            <div className="border border-border bg-white p-6 text-sm text-muted-foreground">
              {t("formLoading")}
            </div>
          }
        >
          <ReturnRequestForm />
        </Suspense>

        <p>
          <Link href="/catalog" className="text-foreground underline">
            {t("toCatalog")}
          </Link>
        </p>
      </div>
    </div>
  );
}
