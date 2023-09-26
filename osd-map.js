#!/usr/bin/node
const { spawnSync } = require('child_process')

const run = (cmd, args, json = false) => {
  try {
    const c = spawnSync(cmd, args, { encoding: 'utf8' })
    if (c.error) return
    if (json) return JSON.parse(c.stdout)
    return c.stdout
  } catch (e) {
    //console.log('ERROR: run(',cmd, args,'):', e)
  }
}

const etcd_list = prefix => {
  try {
    const raw = run('etcdctl', ['get', '--prefix', prefix])
    const lines = raw.split('\n')
    let key, val, out = {}
    for (let l = 0; l < lines.length; l++) {
      const line = lines[l]
      if (!line) continue
      if (line.indexOf(prefix) === 0) {
        key = line.slice(prefix.length + 1)
        //console.log('key -> ['+key+']')
        continue
      }
      if (line.indexOf('{') === 0) {
        val = JSON.parse(line)
        out[key] = val
      }
    }
    return out
  } catch (e) {
    //console.log('ERROR: etcd_list('+prefix+'):', e)
  }
  return {}
}

const get_info_from_drives = () => {
  try {
    const out = {}
    const lsblk = run('lsblk', ['-Jlo', 'NAME,SIZE,ROTA,PARTUUID,PARTTYPE'], true)
    if (!lsblk || !lsblk.blockdevices) return
    lsblk.blockdevices.forEach(i => {
      if (i.parttype !== 'e7009fac-a5a1-4d72-af72-53de13059903') return

      const devuuid = '/dev/disk/by-partuuid/' + i.partuuid
      const r = run('vitastor-disk', ['read-sb', devuuid], true)
      if (r && r.osd_num) {
        if (!out[r.osd_num]) out[r.osd_num] = {}
        if (devuuid === r.data_device) out[r.osd_num] = { ...r, ...out[r.osd_num], data: i.name, rota: i.rota }
        if (devuuid === r.meta_device) out[r.osd_num] = { ...out[r.osd_num], meta: i.name }
        if (devuuid === r.journal_device) out[r.osd_num] = { ...out[r.osd_num], journal: i.name }
      }
    })
    return out
  } catch (e) {
    //console.log('- get_info_from_drives: Error:', e)
  }
  return {}
}

const print = arr => {
  const narr = []
  for (let i = 0; i < arr.length; i++) {
    if (typeof arr[i] === 'undefined') continue
    narr.push(arr[i])
    if (arr[i].toString().length < 6) narr.push('\t')
    narr.push('\t')
  }
  console.log(' ', ...narr)
}

const fmt_size = size => {
  const gb = Math.round(size / 1073741824, 2)
  if (gb < 1024) return gb + ' GB'
  const tb = Math.round(gb / 1024, 2)
  return tb + ' TB'
}

// total
const all = etcd_list('/vitastor/osd/stats')
const live = etcd_list('/vitastor/osd/state')
const conf = etcd_list('/vitastor/config/osd')
const info = get_info_from_drives()

const osds = Object.keys(all).map(k => ({ osd: k, ...all[k], ...(live[k] || {}), ...(conf[k] || {}), ...(info[k] || {}) }))
// console.log('- osds ->', osds[0])


print(['OSD', 'GB', 'Block', 'Tag', 'Addresses', 'Latency', 'UP', 'Local'])
const out = osds.sort((a, b) => a.host && a.host.localeCompare(b.host))

let host
for (let x = 0; x < out.length; x++) {
  const i = out[x]

  if (host !== i.host) {
    console.log('+ node', i.host)
    host = i.host
  }

  let lat = '-'
  if (i.op_stats) {
    const { read, write, write_stable } = i.op_stats

    lat = (Math.round(Math.max(
      (read.usec / read.count) || 0,
      (write.usec / write.count) || 0,
      (write_stable.usec / write_stable.count) || 0
    ) / 10 ** 3) / 1000)
  }

  print([
    +i.osd,
    Math.round(10000 * (i.size - i.free) / i.size) / 100 + '%\t' + fmt_size(i.size),
    i.data_block_size / 1024 + 'k',
    i.tags,
    i.addresses ? i.addresses.join(',') : '-',
    lat,
    i.state || 'down',
    i.data ? (i.data + (i.journal ? ' +jrnl[' + i.journal + ']' : '') + (i.meta ? ' +meta[' + i.meta + ']' : '')) : ''
  ])
}
