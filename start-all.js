const { spawn, execSync } = require("child_process");
const path = require("path");
const os = require("os");

const ROOT_DIR = __dirname;
const JAR_PATH = path.join(ROOT_DIR, "lib", "mysql-connector-j-26.7.0.jar");
const CP_SEP = process.platform === "win32" ? ";" : ":";
const CLASSPATH = `.${CP_SEP}${JAR_PATH}`;

function getLocalIpAddresses() {
  const interfaces = os.networkInterfaces();
  const addresses = [];
  for (const name of Object.keys(interfaces)) {
    for (const net of interfaces[name]) {
      if (net.family === "IPv4" && !net.internal) {
        addresses.push(net.address);
      }
    }
  }
  return addresses;
}

const localIps = getLocalIpAddresses();

console.log("=======================================================");
console.log("🚀 Starting Library Management System Full-Stack App...");
console.log("💻 Local PC:       http://localhost:8080 (or :3000)");
localIps.forEach(ip => {
  console.log(`📱 Mobile (Phone): http://${ip}:8080 (or :3000)`);
});
console.log("ℹ️  To open on phone Chrome: connect phone to same Wi-Fi");
console.log("=======================================================");

// 1. Compile Java
try {
  console.log("🔨 Compiling Java backend (Server.java & dbconnection.java)...");
  execSync(`javac -cp "${CLASSPATH}" Server.java dbconnection.java`, {
    cwd: ROOT_DIR,
    stdio: "inherit"
  });
  console.log("✅ Java compilation successful.");
} catch (err) {
  console.error("❌ Failed to compile Java backend. Ensure JDK 21+ is in your PATH.");
  process.exit(1);
}

// 2. Spawn Java Backend
console.log("📦 Starting Java Backend on port 8080...");
const backend = spawn("java", ["-cp", CLASSPATH, "Server"], {
  cwd: ROOT_DIR,
  stdio: "inherit",
  env: {
    ...process.env,
    PORT: process.env.BACKEND_PORT || "8080"
  }
});

backend.on("error", (err) => {
  console.error("❌ Failed to start Java backend process:", err.message);
});

// 3. Spawn Node.js Frontend / Proxy Server
console.log("🌐 Starting Node Frontend Proxy on port 3000...");
const frontend = spawn("node", ["server.js"], {
  cwd: ROOT_DIR,
  stdio: "inherit",
  env: {
    ...process.env,
    PORT: process.env.PORT || "3000",
    BACKEND_URL: process.env.BACKEND_URL || "http://localhost:8080"
  }
});

frontend.on("error", (err) => {
  console.error("❌ Failed to start Frontend server:", err.message);
});

function cleanup() {
  console.log("\n🛑 Shutting down servers...");
  try {
    backend.kill();
  } catch (e) {}
  try {
    frontend.kill();
  } catch (e) {}
  process.exit(0);
}

process.on("SIGINT", cleanup);
process.on("SIGTERM", cleanup);
process.on("exit", cleanup);
