/** @param {NS} ns **/
export async function main(ns) {
	ns.disableLog("ALL");
	ns.tail();
	const batchIdPort = ns.getPortHandle(1)
	while (true) {
		if (!batchIdPort.empty()) {
			ns.print("last executed batchId = " + batchIdPort.read())
		} else {
			await ns.sleep(200)
		}
	}
}