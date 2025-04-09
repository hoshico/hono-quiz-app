// components/Layout.tsx
import { FC } from "hono/jsx";

export const Layout: FC = (props) => (
  <html lang="ja">
    <head>
      <meta charSet="UTF-8" />
      <title>リアルタイムクイズ</title>
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <script src="https://cdn.tailwindcss.com"></script>{" "}
      {/* 👈 これを追加！ */}
    </head>
    <body class="bg-gray-100 min-h-screen p-6">
      <main>{props.children}</main>
    </body>
  </html>
);
