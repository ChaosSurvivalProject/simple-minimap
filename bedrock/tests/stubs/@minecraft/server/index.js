// 最小桩：只暴露 main.js 用到的成员，行为按脚本语义实现
export const CommandPermissionLevel = { Any: 0, GameDirectors: 1, Admin: 2, Host: 3, Owner: 4 };
export const CustomCommandStatus = { Success: 0, Failure: 1 };

export const fake = {
  players: [],
  intervals: [],
  startupHandlers: [],
  shutdownHandlers: [],
  leaveBefore: [],
  leaveAfter: [],
  unloaded: [],          // [x0,x1] 区间视为未加载
  blocks: new Map(),     // "x,z" -> typeId
  log: [],
};

export function setUnloaded(a, b) { fake.unloaded = [a, b]; }
export function reset() {
  // 必须原地清空：signal() 在模块加载时就抓住了数组引用，换成新数组会让订阅丢失
  fake.players.length = 0; fake.intervals.length = 0; fake.startupHandlers.length = 0;
  fake.shutdownHandlers.length = 0; fake.leaveBefore.length = 0; fake.leaveAfter.length = 0;
  fake.unloaded = null; fake.blocks.clear(); fake.log.length = 0;
}

export function makePlayer(id, x, y, z) {
  const dp = new Map();
  const p = {
    id, typeId: "minecraft:player",
    location: { x, y, z },
    dimension: {
      id: "overworld",
      isChunkLoaded(loc) {
        if (fake.unloaded && loc.x >= fake.unloaded[0] && loc.x <= fake.unloaded[1]) return false;
        return true;
      },
      getTopmostBlock(xz) {
        const key = xz.x + "," + xz.z;
        let type = fake.blocks.get(key);
        if (type === undefined) {
          const s = xz.x + xz.z * 3;
          if (s % 11 === 0) type = "minecraft:water";
          else if (s % 5 === 0) type = "minecraft:oak_leaves";
          else if (s % 3 === 0) type = "minecraft:sand";
          else if (s % 2 === 0) type = "minecraft:stone";
          else type = "minecraft:grass_block";
          fake.blocks.set(key, type);
        }
        return { typeId: type, isAir: false };
      },
      getPlayers() { return fake.players; },
    },
    onScreenDisplay: {
      last: null,
      setActionBar(text) { this.last = text; },
    },
    getDynamicProperty(k) { return dp.has(k) ? dp.get(k) : undefined; },
    setDynamicProperty(k, v) { if (v === undefined) dp.delete(k); else dp.set(k, v); },
    getDynamicPropertyIds() { return [...dp.keys()]; },
    sendMessage(t) { fake.log.push("msg:" + t); },
    _dp: dp,
  };
  return p;
}

function signal(handlers) {
  return { subscribe: (h) => { handlers.push(h); return h; }, fire: (e) => handlers.forEach((h) => h(e)) };
}

export const world = {
  getPlayers() { return fake.players; },
  beforeEvents: { playerLeave: signal(fake.leaveBefore) },
  afterEvents: { playerLeave: signal(fake.leaveAfter) },
};

export const system = {
  runInterval(fn, interval) { fake.intervals.push({ fn, interval }); return fake.intervals.length; },
  run(fn) { fn(); },
  beforeEvents: {
    startup: { subscribe: (h) => { fake.startupHandlers.push(h); } },
    shutdown: signal(fake.shutdownHandlers),
  },
};
