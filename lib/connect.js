/** @param {NS} ns **/
import { findPath } from "/exe/find-path.js"

export function connectx(ns, target) {
	const path = findPath(ns, target, ns.getCurrentServer())
	for (const node of path) {
		if (!ns.connect(node)) {
			throw "Cannot connect to node " + node + " from " + ns.getHostname() + ". Path: " + path
		}
	}
}

export async function main(ns) {
	connectx(ns, ns.args[0])
}