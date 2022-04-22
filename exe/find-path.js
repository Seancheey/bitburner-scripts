class Step {
	constructor(host, lastStep) {
		this.host = host
		this.lastStep = lastStep
	}
}

export function findPath(ns, target, fromServer='home') {
	if (!target) {
		ns.toast("Specify the target as first argument", 'error')
	}
	const toFind = [new Step(fromServer)];
	const found = new Set();

	while (toFind.length > 0) {
		const step = toFind.shift()
		found.add(step.host)
		if (step.host == target) {
			const path = []
			let cur = step
			while (cur) {
				path.unshift(cur.host)
				cur = cur.lastStep
			}
			path.shift()
			return path;
		}
		for (let hostname of ns.scan(step.host)) {
			if (found.has(hostname)) {
				continue;
			}
			toFind.push(new Step(hostname, step))
		}
	}

	ns.toast("Unable to find " + target, 'error', 20000)
	return [];
}

/** @param {NS} ns **/
export async function main(ns) {
	const path = findPath(ns, ns.args[0])
	ns.toast("Depth=" + path.length + ", path: " + path, 'success', 20000)
	ns.tprintf("%s", path.map(p => 'connect ' + p).join(';'))
}