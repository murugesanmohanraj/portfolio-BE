(async () => {
  try {
    const res = await fetch("http://localhost:5000/api/assistant", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "Check after code update" }),
    });
    const j = await res.json();
    console.log(JSON.stringify(j, null, 2));
  } catch (e) {
    console.error("ERR", e.message);
    process.exit(1);
  }
})();
