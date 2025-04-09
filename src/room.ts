import { DurableObject } from "cloudflare:workers";

type User = {
  id: string;
  nickname: string;
  answer?: string;
};

export class Room extends DurableObject {
  users = new Map<WebSocket, User>();
  allSockets = new Set<WebSocket>();
  currentQuestion?: { question: string; options: string[] };

  async fetch(request: Request): Promise<Response> {
    const [client, server] = Object.values(new WebSocketPair());

    server.accept(); // ✅ これが一番確実！
    this.setup(server);

    return new Response(null, {
      status: 101,
      webSocket: client,
    });
  }

  setup(ws: WebSocket) {
    this.allSockets.add(ws);
    ws.addEventListener("message", async (event) => {
      const raw =
        typeof event.data === "string" ? event.data : String(event.data);
      console.log("[DO] raw message:", raw);

      try {
        const data = JSON.parse(raw);
        console.log("[DO] parsed message:", data);
        if (data.type === "register" && data.nickname) {
          const user: User = {
            id: crypto.randomUUID(),
            nickname: data.nickname,
          };
          this.users.set(ws, user);
          console.log("👤 Registered:", data.nickname);

          // 👇 すでに出題中の問題があれば、個別に送信
          if (this.currentQuestion) {
            ws.send(
              JSON.stringify({
                type: "quiz_start",
                ...this.currentQuestion,
              })
            );
          }

          this.broadcastUserList();
        }

        if (data.type === "answer" && typeof data.answer === "string") {
          console.log("👤 Answer:", data.answer);
          const user = this.users.get(ws);
          if (user) {
            user.answer = data.answer;
            console.log(`✅ ${user.nickname} answered: ${data.answer}`);
            this.broadcastUserList();
          }
        }

        if (data.type === "start_quiz") {
          const question = "日本の首都は？";
          const options = ["東京", "大阪", "名古屋"];

          this.currentQuestion = { question, options }; // 👈 現在の問題として保持

          this.broadcast({
            type: "quiz_start",
            question,
            options,
          });
        }

        if (data.type === "reveal_answer") {
          console.log("👤 Reveal answer");
          const correctAnswer = "東京"; // 仮
          this.broadcast({
            type: "answer_result",
            correctAnswer,
          });
        }
      } catch (err) {
        console.error("❌ Error:", err);
      }
    });

    ws.addEventListener("close", () => {
      this.users.delete(ws);
      this.broadcastUserList();
    });
  }

  broadcast(data: unknown) {
    const message = JSON.stringify(data);
    for (const ws of this.allSockets) {
      try {
        ws.send(message);
      } catch (e) {
        console.warn("⚠️ Failed to send:", e);
      }
    }
  }

  broadcastUserList() {
    const list = Array.from(this.users.values()).map((u) => ({
      nickname: u.nickname,
      answer: u.answer,
    }));
    this.broadcast({
      type: "user_list",
      users: list,
    });
  }
}
