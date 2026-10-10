import { Link } from "@/i18n/navigation";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

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
          <p className="mt-3 leading-relaxed">{t("returnCost")}</p>
        </section>

        <p>
          <Link href="/catalog" className="text-foreground underline">
            {t("toCatalog")}
          </Link>
        </p>
      </div>
    </div>
  );
}
