import { findBestServerToHack } from 'lib/find-best-server-to-hack.js'

export async function main(ns) {

    // Infinite loop that continously hacks/grows/weakens the target server
    while (true) {
        const target = findBestServerToHack(ns)
        const securityThresh = ns.getServerMinSecurityLevel(target) + 1;

        if (ns.getServerSecurityLevel(target) > securityThresh) {
            await ns.weaken(target);
        } else {
            await ns.grow(target);
        }
        ns.print("money available: " + Math.round(ns.getServerMoneyAvailable(target) / ns.getServerMaxMoney(target) * 100) + "%")
    }
}