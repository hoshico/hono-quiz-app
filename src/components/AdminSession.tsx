import { Layout } from "./Layout";

export const AdminSession = () => {
  return (
    <Layout>
      <div class="max-w-xl mx-auto bg-white rounded-xl shadow p-6 space-y-4">
        <h1 class="text-2xl font-bold text-center text-indigo-700">
          🧑‍💼 管理者画面
        </h1>

        <ul id="admin-users" class="space-y-2 text-gray-800"></ul>

        <div class="flex gap-4 justify-center">
          <button
            id="start"
            class="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            問題を出題
          </button>
          <button
            id="reveal"
            class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 hidden"
          >
            回答を発表
          </button>
        </div>
      </div>

      <script
        dangerouslySetInnerHTML={{
          __html: `
          const protocol = location.protocol === "https:" ? "wss://" : "ws://";
          const ws = new WebSocket(protocol + location.host + "/room");

          ws.onopen = () => {
            ws.send(JSON.stringify({
              type: "register",
              nickname: "__admin__"
            }));
          };

          ws.onmessage = (e) => {
            const data = JSON.parse(e.data);
            console.log("📨 [admin] message:", data);

            if (data.type === "user_list") {
              const users = data.users.filter(u => u.nickname !== "__admin__");

              document.getElementById("admin-users").innerHTML = users.map(u => 
                \`<li class="border p-2 rounded">\${u.nickname}：\${u.answer || "未回答"}</li>\`
              ).join("");

              const allAnswered = users.length > 0 && users.every(u => u.answer);
              document.getElementById("reveal").style.display = allAnswered ? "inline-block" : "none";
            }
          };

          document.getElementById("start").addEventListener("click", () => {
            ws.send(JSON.stringify({ type: "start_quiz" }));
          });

          document.getElementById("reveal").addEventListener("click", () => {
            ws.send(JSON.stringify({ type: "reveal_answer" }));
          });
        `,
        }}
      />
    </Layout>
  );
};
