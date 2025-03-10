import { Row } from "./components/row";
import { SlButton, SlSpinner } from "@shoelace-style/shoelace/dist/react";
import {
  connected,
  ntcore1,
  checks,
  enabled,
  clearEventTarget,
  ntcore2,
} from "./nt";
import { render } from "preact";
import { signal } from "@preact/signals";
import { toast } from "./components/toast";
import FeatherIcon from "feather-icons-react";
import { version } from "../package.json";
const favicon = new URL("favicon.png", import.meta.url);

if ("serviceWorker" in navigator)
  navigator.serviceWorker
    .register(new URL("sw.js", import.meta.url), {
      type: "module",
    })
    .catch((r) => console.warn("Failed to register service worker", r));

window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  const installButton = document.getElementById("install-button");
  if (installButton) {
    installButton.style.display = "block";
  }
  toast("Website is no longer supported, please download the app!", "danger");
});

window.addEventListener("error", (ev) => {
  toast(`${ev.message}`, "danger");
});
window.addEventListener("unhandledrejection", (ev) => {
  toast(`${ev.reason}`, "danger");
});

const savedIp = localStorage.getItem("ip");
const addr = signal(savedIp || "127.0.0.1");
const running = signal(false);

function App() {
  return (
    <div>
      <div class="body">
        <div
          class="welcome"
          hidden={Object.keys(checks.value).length > 0}
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
          }}
        >
          <img
            src={favicon.href}
            height="100"
            width="100"
            style={{
              filter: "saturate(0)",
              opacity: 0.1,
              height: "min(50vh, 50vw)",
              width: "min(50vh, 50vw)",
            }}
          ></img>
        </div>
        {Object.entries(checks.value)
          .sort(
            ([, checkA], [, checkB]) =>
              checkB.faults.value.length - checkA.faults.value.length ||
              Number(checkA.statusText.value.includes("OK")) -
                Number(checkB.statusText.value.includes("OK"))
          )
          .map(([name, check]) =>
            check.runStatus.value ? (
              <Row type="running" subsystem={name}>
                Executing <code>SystemCheck</code> command...
              </Row>
            ) : check.faults.value.length ? (
              check.faults.value.map((fault) => (
                <Row type="fault" subsystem={name}>
                  {fault}
                </Row>
              ))
            ) : (
              <Row
                type={
                  check.statusText.value.includes("OK") ? "info" : "unknown"
                }
                subsystem={name}
              >
                {check.statusText}
              </Row>
            )
          )}
      </div>
      <div className="stat">
        <div
          id="install-button"
          style={{ display: "none" }}
          onClick={(ev) => {
            ev.currentTarget.style.display = "none";
            open("https://github.com/TANofX/testy/releases");
          }}
        >
          Install App
        </div>
        <div>v{version}</div>
        <div
          onClick={() => {
            const team = prompt("Team number or IP Address");
            if (!team) return;
            const [ip, p] = team.split(":");
            const address = ip.match(/^[0-9]+$/)
              ? `roborio-${ip}-frc.local`
              : ip;
            const port = Number.isNaN(parseInt(p)) ? 5810 : parseInt(p);
            ntcore1.changeURI(address, port);
            ntcore2.changeURI(address, port);
            localStorage.setItem("ip", address);
            localStorage.setItem("port", `${p}`);
            addr.value = address;
            clearEventTarget();
            checks.value = {};
          }}
        >
          <code>{addr}</code>
        </div>
        <div>{connected}</div>
        <div>{enabled.value ? "En" : "Dis"}abled</div>
      </div>
      <SlButton
        onClick={async () => {
          let current: string = "None";
          if (running.value) return (running.value = false);
          try {
            if (enabled.value) {
              running.value = true;
              toast("SystemCheck requested.");
              for (const [name, check] of Object.entries(checks.value)) {
                current = name;
                await check.run();
                if (!running.value) break;
              }
              toast("SystemCheck completed.");
              running.value = false;
            } else toast("Robot is not enabled.", "danger");
          } catch (e) {
            toast(`SystemCheck failed at ${current}.`, "danger");
            console.error(e);
            running.value = false;
          }
        }}
        circle
        class="float"
      >
        <FeatherIcon icon={running.value ? "square" : "play"}></FeatherIcon>
        {running.value && (
          <SlSpinner
            style={{
              fontSize: "2.5rem",
              "--track-width": "3px",
              '--indicator-color': 'orange'
            }}
            class="float"
          ></SlSpinner>
        )}
      </SlButton>
    </div>
  );
}

render(<App />, document.body);
