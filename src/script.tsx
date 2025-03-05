import { registerIconLibrary } from "@shoelace-style/shoelace/dist/shoelace.js";
import { Row } from "./components/row";
import { SlButton } from "@shoelace-style/shoelace/dist/react";
import { ntcore } from "./nt";
import { render } from "preact";
registerIconLibrary("default", {
  resolver: (name) =>
    `https://cdn.jsdelivr.net/npm/feather-icons@4.28.0/dist/icons/${name}.svg`,
});

if ("serviceWorker" in navigator)
  navigator.serviceWorker.register(new URL("sw.js", import.meta.url), {
    type: "module",
  });

const savedIp = localStorage.getItem("ip");

function App() {
  return (
    <div>
      <div className="body">
        <Row type="info">Hello world</Row>
      </div>
      <div className="side">
        <SlButton>Run Checks</SlButton>
      </div>
      <div className="stat">
        <div onClick={ev=>{
          const team = prompt("Team number or IP Address");
          if(!team) return;
          const [ip, p] = team.split(":");
          const port = parseInt(p);
          if(ip.match(/^[0-9]+$/)) changeURI(`roborio-${ip}-frc.local`, port);
          else changeURI(ip, port);
          ev.currentTarget.textContent = team;
        }}><code>{savedIp || "127.0.0.1"}</code></div>
        <div id="connection">Loading</div>
      </div>
    </div>
  );
}

function changeURI(ip: string, port: number) {
  const p = Number.isNaN(port) ? 5810 : port;
  ntcore.changeURI(ip, p);
  localStorage.setItem("ip", ip);
  localStorage.setItem("port", `${p}`);
}

render(<App />, document.body);