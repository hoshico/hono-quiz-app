import { Layout } from "./Layout";

export const Waiting = () => {
  return (
    <Layout>
      <div class="max-w-xl mx-auto bg-white rounded-xl shadow p-6 space-y-4">
        <h1 class="text-2xl font-bold text-center text-indigo-700">
          🕐 待機中...
        </h1>
        <ul id="users" class="space-y-2 text-gray-800"></ul>
      </div>

      <script
        dangerouslySetInnerHTML={{
          __html: `
          const params = new URLSearchParams(location.search);
          const nickname = params.get("nickname");

          if (!nickname) {
            alert("ニックネームが見つかりません");
            location.href = "/register";
          }

          let selectedAnswer = "";
          let answered = false;

          const protocol = location.protocol === "https:" ? "wss://" : "ws://";
          const ws = new WebSocket(protocol + location.host + "/room");

          ws.onopen = () => {
            ws.send(JSON.stringify({ type: "register", nickname }));
          };

          ws.onmessage = (e) => {
            const data = JSON.parse(e.data);

            if (data.type === "user_list") {
              const visibleUsers = data.users.filter(u => u.nickname !== "__admin__");

              document.getElementById("users").innerHTML = visibleUsers.map(u =>
                \`<li class="border p-2 rounded">\${u.nickname} が参加中</li>\`
              ).join("");
            }

            if (data.type === "quiz_start") {
              const container = document.querySelector(".max-w-xl");
              answered = false;
              selectedAnswer = "";

              container.innerHTML = \`
                <h1 class="text-2xl font-bold text-center text-indigo-700">🧠 クイズに答えてください！</h1>
                <h2 class="text-xl font-semibold text-center text-gray-800 mb-4">\${data.question}</h2>
                <form id="answer-form" class="flex flex-col gap-3">
                  \${data.options.map(opt => \`
                    <label class="flex items-center gap-2">
                      <input type="radio" name="answer" value="\${opt}" required class="accent-indigo-600">
                      <span>\${opt}</span>
                    </label>
                  \`).join("")}
                  <button type="submit" class="mt-4 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">回答する</button>
                </form>
              \`;

              const form = document.getElementById("answer-form");
              form.addEventListener("submit", function (e) {
                e.preventDefault();
                selectedAnswer = form.answer.value;
                answered = true;

                ws.send(JSON.stringify({
                  type: "answer",
                  answer: selectedAnswer,
                  nickname
                }));

                form.innerHTML = \`
                  <p class="text-center text-green-700 font-semibold">回答を受け付けました！</p>
                  <p class="text-center text-gray-600">発表をお待ちください…</p>
                \`;
              });
            }

            if (data.type === "answer_result") {
              const correct = data.correctAnswer;
              const isCorrect = selectedAnswer === correct;

              const box = document.querySelector(".max-w-xl");

              box.innerHTML += \`
                <div class="mt-6 text-center">
                  <p class="text-lg font-bold \${isCorrect ? "text-green-600" : "text-red-600"}">
                    あなたの回答：\${selectedAnswer}
                  </p>
                  <p class="text-indigo-700 mt-2 font-semibold">
                    正解は「\${correct}」でした！
                  </p>
                  <p class="mt-2 font-semibold \${isCorrect ? "text-green-600" : "text-red-600"}">
                    \${isCorrect ? "🎉 正解です！" : "😢 残念、不正解！"}
                  </p>
                </div>
              \`;
            }
          };
        `,
        }}
      />
    </Layout>
  );
};
