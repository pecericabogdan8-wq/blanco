import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Повернення",
  description: "Умови повернення та обміну blanco",
};

export default function ReturnsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <h1 className="font-display text-4xl font-bold tracking-tight">Повернення</h1>
      <div className="prose prose-neutral mt-8 max-w-none space-y-6 text-muted-foreground">
        <p>
          Ви можете повернути або обміняти річ протягом <strong className="text-foreground">14 днів</strong> з
          моменту отримання, якщо вона не була у використанні, збережені бірки та товарний вигляд.
        </p>
        <ol className="list-decimal space-y-2 pl-5">
          <li>Напишіть у чат підтримки або на email з номером замовлення.</li>
          <li>Відправте посилку Новою Поштою на адресу, яку надішле менеджер.</li>
          <li>Після перевірки повернемо кошти на картку протягом 5–7 робочих днів.</li>
        </ol>
        <p>
          Вартість зворотної доставки — за рахунок покупця, крім випадків браку або помилки з нашого боку.
        </p>
        <p>
          Питання? Відкрийте чат «Підтримка» внизу екрана — AI відповість одразу, складні кейси підуть у
          Telegram команді.
        </p>
        <p>
          <Link href="/catalog" className="text-foreground underline">
            Повернутись до каталогу
          </Link>
        </p>
      </div>
    </div>
  );
}
