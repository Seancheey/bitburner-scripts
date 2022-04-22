/** @param {NS} ns **/

const expectedMaxFinishTime = 60*1000 // 1min

export function getThreadNum(ns, server, scriptRam) {
	var totalRam = ns.getServerMaxRam(server)
	var usedRam = ns.getServerUsedRam(server)
	var leftRam = totalRam - usedRam;
	return Math.floor(leftRam / scriptRam);
}

export async function execToMaxRam(ns, script, server, numThreadForEachScript, ...args) {
	if(numThreadForEachScript == 0){
		ns.print("execToMaxRam: numThreadForEachScript is 0. skipping execution.")
		return;
	}
	await ns.scp(script, server)
	const numTotalThread = getThreadNum(ns, server, ns.getScriptRam(script))
	const fullThreadScriptNum = Math.floor(numTotalThread / numThreadForEachScript)
	const leftOverThreadCount = numTotalThread - fullThreadScriptNum * numThreadForEachScript
	const scriptNum = fullThreadScriptNum + (leftOverThreadCount > 0 ? 1 : 0)
	const intervalSleepTime = Math.min(expectedMaxFinishTime/scriptNum, 1000)
	ns.print('execToMaxRam: scriptNum=' + scriptNum + ', threadNum=' + numThreadForEachScript +", args = " + args)
	for (let i = 0; i < scriptNum; i++) {
		const thread = (i == scriptNum - 1 && leftOverThreadCount > 0) ? leftOverThreadCount : numThreadForEachScript
		ns.print("Executing exploiting in '" + server + "' with " + thread + '/' + numTotalThread + " threads. (script no." + i + ")")
		// note that first argument is passed as i, not ...args. This helps avoiding arg collision and being banned from creating multiple scripts.
		while(ns.isRunning(script, server, i, ...args)){
			i++
		}
		ns.exec(script, server, thread, i, ...args)
		await ns.sleep(intervalSleepTime)
	}
}