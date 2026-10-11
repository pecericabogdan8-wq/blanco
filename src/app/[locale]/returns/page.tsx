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
      <h1 className="font-display text-4xl font-bold tracking-tight">{t("title")}</h1>

      <div className="mt-10 space-y-10 text-muted-foreground">
        <section>
          <h2 className="text-lg font-semibold tracking-wide text-foreground uppercase">
            {t("ordersTitle")}
          </h2>
          <p className="mt-3 leading-relaxed">{t("ordersBody")}</p>
        </section>

        <section>
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
        </section>

        <section>
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
        </section>

        <section>
          <h2 className="text-lg font-semibold tracking-wide text-foreground uppercase">
            {t("defectiveTitle")}
          </h2>
          <p className="mt-3 leading-relaxed">{t("defectiveBody")}</p>
        </section>

        <section>
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
        </section>

        <section>
          <h2 className="text-lg font-semibold tracking-wide text-foreground uppercase">
            {t("conditionsTitle")}
          </h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 leading-relaxed">
            <li>{t("condition1")}</li>
            <li>{t("condition2")}</li>
            <li>{t("condition3")}</li>
          </ul>
          <p className="mt-3 text-sm leading-relaxed">{t("excludedNote")}</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold tracking-wide text-foreground uppercase">
            {t("whatToDoTitle")}
          </h2>
          <ol className="mt-3 list-decimal space-y-2 pl-5 leading-relaxed">
            <li>{t("whatToDo1")}</li>
            <li>{t("whatToDo2")}</li>
            <li>{t("whatToDo3")}</li>
            <li>{t("whatToDo4")}</li>
          </ol>
        </section>

        <section>
          <h2 className="text-lg font-semibold tracking-wide text-foreground uppercase">
            {t("compensationTitle")}
          </h2>
          <p className="mt-3 leading-relaxed">{t("compensationBody")}</p>
          <p className="mt-3 leading-relaxed">{t("returnCost")}</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold tracking-wide text-foreground uppercase">
            {t("exchangeTitle")}
          </h2>
          <p className="mt-3 leading-relaxed">{t("exchangeBody")}</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold tracking-wide text-foreground uppercase">
            {t("returnTitle")}
          </h2>
          <p className="mt-3 leading-relaxed">
            {t.rich("returnBody", {
              days: (chunks) => (
                <strong className="text-foreground">{chunks}</strong>
              ),
            })}
          </p>
          <ol className="mt-3 list-decimal space-y-2 pl-5">
            <li>{t("returnStep1")}</li>
            <li>{t("returnStep2")}</li>
            <li>{t("returnStep3")}</li>
          </ol>
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
