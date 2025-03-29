// src/index.ts
import { Hono } from "hono";
import { Room } from "./room";
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

app.get("/", (c) => c.redirect("/register"));

app.get("/register", (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ja">
    <head><meta charset="UTF-8"><title>ニックネーム登録</title></head>
    <body>
      <h1>ニックネームを入力してください</h1>
      <form id="register-form">
        <input type="text" name="nickname" required />
        <button type="submit">参加する</button>
      </form>

      <script>
        document.getElementById("register-form").addEventListener("submit", (e) => {
          e.preventDefault();
          const nickname = e.target.nickname.value;
          // 👇 URL パラメータに渡して遷移
          location.href = "/waiting?nickname=" + encodeURIComponent(nickname);
        });
      </script>
    </body>
    </html>
  `);
});

app.get("/waiting", (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ja">
    <head><meta charset="UTF-8"><title>待機画面</title></head>
    <body>
      <h1 id="status">🕐 待機中...</h1>
      <ul id="users"></ul>
      <div id="question-box"></div>

      <script>
        const params = new URLSearchParams(location.search);
        const nickname = params.get("nickname"); // 👈 ここで取得！

        if (!nickname) {
          alert("ニックネームが見つかりません");
          location.href = "/register";
        }

        let answered = false;
        let selectedAnswer = "";

        const ws = new WebSocket("ws://" + location.host + "/room");

        ws.onopen = () => {
        console.log("WebSocket connection opened");
          ws.send(JSON.stringify({ type: "register", nickname }));
        };

        ws.onmessage = (e) => {
          const data = JSON.parse(e.data);
          console.log("[DO] raw message:", data);

          if (data.type === "user_list") {
            document.getElementById("users").innerHTML =
              data.users.map(u => "<li>" + u.nickname + "</li>").join("");
          }

          if (data.type === "quiz_start") {
            answered = false;
            selectedAnswer = "";
            document.getElementById("status").textContent = "📝 問題が出題されました！";

            document.getElementById("question-box").innerHTML = \`
              <h2>\${data.question}</h2>
              <form id="answer-form">
                \${data.options.map(opt => \`
                  <label>
                    <input type="radio" name="answer" value="\${opt}" required />
                    \${opt}
                  </label><br />
                \`).join("")}
                <button type="submit">回答する</button>
              </form>
            \`;

            document.getElementById("answer-form").addEventListener("submit", (e) => {
              e.preventDefault();
              const form = e.target;
              const answer = form.answer.value;
              selectedAnswer = answer;
              answered = true;

              ws.send(JSON.stringify({ type: "answer", answer }));

              document.getElementById("question-box").innerHTML = \`
                <p>あなたの回答：<strong>\${answer}</strong></p>
                <p>🔒 回答済み。回答発表を待っています。</p>
              \`;
            });
          }

          if (data.type === "answer_result") {
            document.getElementById("status").textContent = "✅ 回答結果";
            const correct = data.correctAnswer;
            const result = selectedAnswer === correct ? "🎉 正解！" : "❌ 不正解";
            document.getElementById("question-box").innerHTML = \`
              <p>あなたの回答：<strong>\${selectedAnswer}</strong></p>
              <p>正解：<strong>\${correct}</strong></p>
              <p>\${result}</p>
            \`;
          }
        };
      </script>
    </body>
    </html>
  `);
});

app.get("/admin/session", (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ja">
    <head><meta charset="UTF-8"><title>管理者画面</title></head>
    <body>
      <h1>管理者画面</h1>
      <ul id="admin-users"></ul>
      <button id="start">問題を出題</button>
      <button id="reveal" style="display:none;">回答を発表</button>

      <script>
        const ws = new WebSocket("ws://" + location.host + "/room");

        let userAnswers = [];

        ws.onmessage = (e) => {
          const data = JSON.parse(e.data);
          console.log("✅[admin画面] raw message:", data);
          if (data.type === "user_list") {
            userAnswers = data.users;
            document.getElementById("admin-users").innerHTML =
              userAnswers.map(u => {
                return \`<li>\${u.nickname}：\${u.answer || "未回答"}</li>\`;
              }).join("");

            const allAnswered = userAnswers.length > 0 && userAnswers.every(u => !!u.answer);
            document.getElementById("reveal").style.display = allAnswered ? "inline-block" : "none";
          }
        };

        document.getElementById("start").addEventListener("click", () => {
          ws.send(JSON.stringify({
            type: "start_quiz"
          }));
        });

        document.getElementById("reveal").addEventListener("click", () => {
          ws.send(JSON.stringify({
            type: "reveal_answer"
          }));
        });
      </script>
    </body>
    </html>
  `);
});

export default app;
