import { NetworkTables, NetworkTablesTypeInfos } from "ntcore-ts-client";

var checks: Record<string, Check> = {};
const savedIp = localStorage.getItem("ip");
const savedPort = localStorage.getItem("port");

// Get or create the NT client instance
const ntcore = NetworkTables.getInstanceByURI(savedIp || "127.0.0.1", Number(savedPort) || 5810);
ntcore.addRobotConnectionListener(online => {
  const indicator = document.querySelector("#connection");
  if(indicator) indicator.textContent = online ? "Connected" : "Disconnected";
});
const sysStats = ntcore.createPrefixTopic("/SmartDashboard/SystemStatus");
sysStats.subscribe((value, params) => {
  const match = params.name.match(/^\/SmartDashboard\/SystemStatus\/([^/]+)/);
  if(match) checks[`${match[1]}`]
  console.log(`Got Value: ${value} from topic ${params.name}`);
});

class Check {
  private name: string;
  private prefix: string;
  private running;
  constructor(name: string) {
    this.name = name;
    this.prefix = `/SmartDashboard/SystemStatus/${name}`;
    this.running = ntcore.createTopic(`${this.prefix}/SystemCheck/running`, NetworkTablesTypeInfos.kBoolean, false);
  }
}

export {
    ntcore
};