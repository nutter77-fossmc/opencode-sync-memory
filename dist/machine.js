import { hostname as osHostname } from "os";
let _hostname = null;
export function getHostname() {
    if (!_hostname) {
        _hostname = osHostname().split(".")[0];
    }
    return _hostname;
}
//# sourceMappingURL=machine.js.map