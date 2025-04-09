// src/index.ts
import { Hono } from "hono";
import { Room } from "./room";
import { jsxRenderer } from "hono/jsx-renderer";
import { Layout } from "./components/Layout";
import { Waiting } from "./components/Waiting";
import { AdminSession } from "./components/AdminSession";
export { Room };

type Env = {
  Bindings: {
    ROOM: DurableObjectNamespace;
  };
};

const app = new Hono<Env>();

app.all("/room", async (c) => {
  const id = c.env.ROOM.idFromName("quiz-room");
  const stub = c.env.ROOM.get(id);
  return stub.fetch(c.req.raw);
});

app.use(
  "*",
  jsxRenderer(({ children }) => <Layout>{children}</Layout>)
);

app.get("/", (c) => c.redirect("/register"));

app.get("/register", (c) => {
  // コンポーネントを分割して可読性を向上
  const RegisterForm = () => (
    <form id="register-form" class="space-y-4">
      <input
        type="text"
        name="nickname"
        required
        class="w-full border border-gray-300 rounded px-4 py-2"
        placeholder="ニックネーム"
      />
      <button
        type="submit"
        class="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
      >
        参加する
      </button>
    </form>
  );

  // クライアントサイドのロジックを別ファイルに分離することを推奨
  const clientScript = `
    document.getElementById("register-form").addEventListener("submit", (e) => {
      e.preventDefault();
      const nickname = e.target.nickname.value;
      if (!nickname) return;

      const protocol = location.protocol === "https:" ? "wss://" : "ws://";
      const ws = new WebSocket(protocol + location.host + "/room");
      ws.onopen = () => {
        ws.send(JSON.stringify({ type: "register", nickname }));
        location.href = "/waiting?nickname=" + encodeURIComponent(nickname);
      };
    });
  `;

  return c.render(
    <Layout>
      <h1 class="text-xl font-bold mb-4">ニックネームを入力してください</h1>
      <RegisterForm />
      <script dangerouslySetInnerHTML={{ __html: clientScript }} />
    </Layout>
  );
});

app.get("/waiting", (c) => {
  return c.render(<Waiting />);
});

app.get("/admin/session", (c) => {
  return c.render(<AdminSession />);
});

export default app;
