// public/waiting.js
const ws = new WebSocket("ws://" + location.host + "/room");

ws.onopen = () => {
  const nickname = new URLSearchParams(location.search).get("nickname")
  ws.send(JSON.stringify({ type: "register", nickname }))
};

ws.onmessage = (e) => {
  const data = JSON.parse(e.data)
  if (data.type === "user_list") {
    document.getElementById("users").innerHTML =
      data.users.map(u => `<li>${u.nickname}</li>`).join("")
  }
};