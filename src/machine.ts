import { hostname as osHostname } from "os";

let _hostname: string | null = null;

export function getHostname(): string {
  if (!_hostname) {
    _hostname = osHostname().split(".")[0];
  }
  return _hostname;
}
