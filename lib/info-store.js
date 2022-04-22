/** @param {NS} ns */

const infoFolder = '/data/'

export const BIT_NODE_MULTS = 'bit-node-multipliers'
export const SOURCE_FILES = 'owned-source-files'


export function getInfo(ns, key) {
	const files = ns.ls('home', key)
	if (files.length == 0) {
		return null
	}
	if (files.length > 1) {
		ns.toast("Reading " + key + " returned multiple files: " + files, 'error', 20000)
		return null
	}
	const filename = files[0]
	let info = ns.read(filename)
	if (filename.includes('.json')) {
		info = JSON.parse(info)
	}
	return info
}

export async function writeInfo(ns, key, info) {
	let storeInfo = info
	let extension = '.txt'
	if (typeof (info) == 'object') {
		storeInfo = JSON.stringify(storeInfo)
		extension = '.json.txt'
	}

	await ns.write(infoFolder + key + extension, storeInfo, 'w')
}