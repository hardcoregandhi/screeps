var roleHarvester = require("role.harvester");
var roleHarvesterExt = require("role.harvesterExt");
var roleUpgrader = require("role.upgrader");
var roleBuilder = require("role.builder");
var roleTower = require("tower");
var roleClaimer = require("role.claimer");
var roleMover = require("role.mover");
var roleMoverExt = require("role.moverExt");
var roleDefence = require("role.defense");
var roleScavenger = require("role.scavenger");
var roleTraveller = require("role.traveller");
var roleTrucker = require("role.trucker");
var roleSoldier = require("role.soldier");
var rolePowHarvester = require("role.powHarvester");
var rolePowMover = require("role.powMover");

require("manage.spawns");
require("manage.structs");
require("manage.creeps");
require("manage.roads");
require("role.common");

function getRandomInt(min = 100, max = 999) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
getBodyCost = function (bodyParts) {
    return _.sum(bodyParts, (b) => BODYPART_COST[b]);
};
removeAllSites = function (roomName) {
    const sites = Game.rooms[roomName].find(FIND_CONSTRUCTION_SITES);
    for (const site of sites) {
        if (site.progress == 0) site.remove();
    }
};

focusHealing = false;
global.myRooms = ["W16S21", "W15S21", "W19S21", "W17S19"];

spawnCreep = function (_role, customBodyParts = null, customMemory = null, _spawnRoom = null) {
    var ret = -1;

    if (customBodyParts) {
        // console.log("customActivated")
        oldBodyParts = _role.BodyParts;
        _role.BodyParts = customBodyParts;
    }

    if (_spawnRoom != null) {
        room = Game.rooms[_spawnRoom];
        if (room == null) {
            console.log(`Room ${_spawnRoom} not found`);
            return -1;
        }
        roomSpawner = room.find(FIND_STRUCTURES, {
            filter: (structure) => {
                return structure.structureType == STRUCTURE_SPAWN;
            },
        });
        if (roomSpawner.length == 0) {
            console.log(`Spawn could not be found in ${_spawnRoom}`);
            return -1;
        }
        spawn = roomSpawner[0];
        // console.log(`Found spawn ${spawn}`)
    } else {
        spawn = "Spawn1";
        spawn = Game.spawns[spawn];
    }

    cost = getBodyCost(_role.BodyParts);

    if (spawn.room.energyAvailable >= cost && !spawn.spawning) {
        var newName = _.capitalize(_role.name) + "_" + getRandomInt();
        console.log("Spawning new " + _role.name + " : " + newName);

        ret = spawn.spawnCreep(
            _role.BodyParts,
            newName,
            _.merge(
                {
                    memory: {
                        role: _role.name,
                        currentSource: "0",
                        baseRoomName: spawn.room.name,
                    },
                },
                _role.memory,
                customMemory
            )
        );
        if (ret != 0) {
            console.log("Spawn failed: ", ret);
        }
    } else {
        // console.log(`Funds not available: ${cost}`)
        new RoomVisual().text("Next " + spawn.room.name + ": " + _.capitalize(_role.name) + " Cost: " + cost, 1, (nextSpawnOffset += 1) + 0, { align: "left", font: 0.5 });
    }

    if (customBodyParts) {
        // console.log("customDeactivated")
        _role.BodyParts = oldBodyParts;
    }

    return ret;
};

module.exports.loop = function () {

    // Cleanup
    for (var i in Memory.creeps) {
        if (!Game.creeps[i]) {
            delete Memory.creeps[i];
        }
    }

    // Event logging
    _.forEach(Game.rooms, (room) => {
        let eventLog = room.getEventLog();
        let attackEvents = _.filter(eventLog, { event: EVENT_ATTACK });
        attackEvents.forEach((event) => {
            let target = Game.getObjectById(event.data.targetId);
            if (target && target.my) {
                console.log(event);
            }
        });
    });

    // Active Creep Tracking
    global.creepRoomMap = new Map();
    _.forEach(Game.rooms, (r) => {
        creepRoomMap.set(r.name + "builder", 0);
        creepRoomMap.set(r.name + "mover", 0);
        creepRoomMap.set(r.name + "upgrader", 0);
        creepRoomMap.set(r.name + "harvester", 0);
        creepRoomMap.set(r.name + "claimer", 0);
    });

    _.forEach(Game.rooms, (r) => {
        _.forEach(Game.creeps, (c) => {
            key = r.name + c.memory.role;
            if (c.memory.baseRoomName == r.name) {
                if (creepRoomMap.get(key)) {
                    creepRoomMap.set(key, creepRoomMap.get(key) + 1);
                } else {
                    creepRoomMap.set(key, 1);
                }
            } else {
                if (creepRoomMap.get(key) == undefined) {
                    creepRoomMap.set(key, 0);
                }
            }
            creepRoomMap.set(r.name + "csites", r.find(FIND_CONSTRUCTION_SITES).length);
        });
    });

    // Active Energy Tracking
    _.forEach(Game.rooms, (r) => {
        stores = r.find(FIND_STRUCTURES, {
            filter: (structure) => {
                return structure.structureType == STRUCTURE_STORAGE || structure.structureType == STRUCTURE_CONTAINER;
            },
        });
        var total = 0;
        _.forEach(stores, (s) => {
            creepRoomMap.set(r.name + "eenergy", (total += s.store[RESOURCE_ENERGY]));
        });
    });

    // Logging
    roomOffset = 0;
    listOffset = 5;
    for (var room in Game.rooms) {
        r = Game.rooms[room];
        // if (!myRooms.includes(r.name)) {
        //     continue
        // }
        // Creep info
        new RoomVisual().text(r.name, 1, listOffset + roomOffset + 0.5, { align: "left", font: 0.5 });
        new RoomVisual().text("🔋  ExcessEnergy: " + creepRoomMap.get(r.name + "eenergy"), 1, listOffset + roomOffset + 1, { align: "left", font: 0.5 });
        new RoomVisual().text("⚡️ Energy      : " + r.energyAvailable + "/" + r.energyCapacityAvailable, 1, listOffset + roomOffset + 1.5, { align: "left", font: 0.5 });
        new RoomVisual().text("⛏️ Harvesters  : " + creepRoomMap.get(r.name + "harvester"), 1, listOffset + roomOffset + 2, { align: "left", font: 0.5 });
        new RoomVisual().text("🚚 Movers      : " + creepRoomMap.get(r.name + "mover"), 1, listOffset + roomOffset + 2.5, { align: "left", font: 0.5 });
        new RoomVisual().text("👷 Builders    : " + creepRoomMap.get(r.name + "builder"), 1, listOffset + roomOffset + 3, { align: "left", font: 0.5 });
        new RoomVisual().text("🚧 C sites     : " + creepRoomMap.get(r.name + "csites"), 1, listOffset + roomOffset + 3.5, { align: "left", font: 0.5 });
        new RoomVisual().text("🔺Upgraders    : " + creepRoomMap.get(r.name + "upgrader"), 1, listOffset + roomOffset + 4, { align: "left", font: 0.5 });
        new RoomVisual().text("HarvestExt    : " + creepRoomMap.get(r.name + "harvesterExt"), 1, listOffset + roomOffset + 4.5, { align: "left", font: 0.5 });
        new RoomVisual().text("MoverExt    : " + creepRoomMap.get(r.name + "moverExt"), 1, listOffset + roomOffset + 5, { align: "left", font: 0.5 });
        roomOffset += 5;
    }

    runSpawns();

    runCreeps();
    
    runStructs()

    // runRoads();
    
};
