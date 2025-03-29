// src/components/Layout.tsx
import { FC } from "hono/jsx";

export const Layout: FC = (props) => (
  <html lang="ja">
    <head>
      <meta charSet="UTF-8" />
      <title>リアルタイムクイズ</title>
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <style>{`
        body {
          font-family: sans-serif;
          padding: 1rem;
          background: #f9f9f9;
        }
        h1 {
          font-size: 1.5rem;
          margin-bottom: 1rem;
        }
        ul {
          padding-left: 1rem;
        }
      `}</style>
    </head>
    <body>
      <main>{props.children}</main>
    </body>
  </html>
);
