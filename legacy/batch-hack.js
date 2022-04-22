import { getProfitabilityScore, getBestThreadConfig, getRamConstraintThreadConfig, getBatchRam } from "lib/analysis.js"
import { findBestServerToHack } from "lib/find-best-server-to-hack.js"
import { findAllServers, findAllRootAccessServers } from "lib/find-all-servers.js"

const operationDelayInterval = 20 // ms
const hackOnceScript = 'exe/hack.script'
const weakenOnceScript = 'exe/weaken.script'
const growOnceScript = 'exe/grow.script'

/** @param {NS} ns **/
export async function main(ns) {
	const hostname = ns.getHostname()
	const attacker = hostname

	async function sleep() {
		await ns.sleep(operationDelayInterval)
	}

	ns.disableLog('ALL')
	const player = ns.getPlayer()
	const target = ns.args[0] || findBestServerToHack(ns)
	const targetServer = ns.getServer(target)
	const bestConfig = getBestThreadConfig(ns, target, 'home')
	const [h, g, w] = bestConfig
	const minSecurity = ns.getServerMinSecurityLevel(target);

	ns.print(target + " score: " + getProfitabilityScore(ns, target) + ' with thread:' + bestConfig)
	ns.toast(target + " score: " + getProfitabilityScore(ns, target) + ' with thread:' + bestConfig, 'success', 10000)


	// Restore server to best state first
	const moneyAvailable = ns.getServerMoneyAvailable(target) / ns.getServerMaxMoney(target) * 100
	const ramLeft = ns.getServerMaxRam(hostname) - ns.getServerUsedRam(hostname)
	while (true) {
		if (ns.getServerSecurityLevel(target) > minSecurity + 5) {
			const threadCount = Math.floor(Math.min(ramLeft / 1.75, (ns.getServerSecurityLevel(target) - minSecurity) / 0.05))
			ns.exec(weakenOnceScript, hostname, 3, target)
			ns.print("Find-tune security level to " + minSecurity + " with " + threadCount + "thread, currentSecurity = " + ns.getServerSecurityLevel(target))
		}
		if (moneyAvailable < 98) {
			if (ramLeft < getBatchRam(ns, 0, 12, 1)) {
				ns.print("Waiting for more RAM to grow money available: current " + moneyAvailable + "%")
				await ns.sleep(1000)
				continue
			}
			ns.print("Fine-tune money available: current " + moneyAvailable + "%")
			ns.exec(growOnceScript, hostname, 12, target)
			ns.exec(weakenOnceScript, hostname, 1, target)
			await sleep()
			continue
		}
		break
	}

	// Begin hack cycle
	const hackTime = ns.formulas.hacking.hackTime(targetServer, player)
	const growTime = ns.formulas.hacking.weakenTime(targetServer, player)
	const weakenTime = ns.formulas.hacking.growTime(targetServer, player)
	const maxDelay = [hackTime, growTime, weakenTime].reduce((a, b) => a > b ? a : b, hackTime)
	const queue = []
	while (true) {
		if (ramLeft < getBatchRam(ns, h, g, w)) {
			ns.print("Waiting for more RAM to spawn batch " + bestConfig)
			await ns.sleep(1000)
			continue
		}
		if (h || g || w) {
			ns.print(attacker + " attack " + target + " with " + [h, g, w])
		}
		if (g) {
			ns.exec(growOnceScript, hostname, g, target)
			await sleep()
		}
		if (w > 0) {
			ns.exec(weakenOnceScript, hostname, 1, target)
			await sleep()
		}
		if (h) {
			ns.exec(hackOnceScript, hostname, h, target);
			await sleep()
		}
		if (w - 1 > 0) {
			ns.exec(weakenOnceScript, hostname, w - 1, target)
			await sleep()
		}
		await sleep()
	}
}