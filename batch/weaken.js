/** @param {NS} ns **/
export async function main(ns) {
	await ns.weaken(ns.args[0])
	ns.writePort(1, ns.args[1] + "W")
}