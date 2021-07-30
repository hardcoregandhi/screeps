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
global.myRooms = ["W16S21", "W15S21", "W19S21"];

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
        new RoomVisual().text(
            "Next " + spawn.room.name + ": " + _.capitalize(_role.name) + " Cost: " + cost,
            1,
            (nextSpawnOffset += 1) + 0,
            { align: "left", font: 0.5 }
        );
    }

    if (customBodyParts) {
        // console.log("customDeactivated")
        _role.BodyParts = oldBodyParts;
    }

    return ret;
};

var spawn = Game.spawns["Spawn1"];

module.exports.loop = function () {
    _.forEach(Game.rooms, (room) => {
        var towers = room.find(FIND_STRUCTURES, {
            filter: (structure) => {
                return structure.structureType == STRUCTURE_TOWER;
            },
        });

        for (var t of towers) {
            roleTower.run(t);
        }

        var pspawns = room.find(FIND_STRUCTURES, {
            filter: (structure) => {
                return structure.structureType == STRUCTURE_POWER_SPAWN;
            },
        });
        for (var p of pspawns) {
            p.processPower();
        }
    });

    for (var i in Memory.creeps) {
        if (!Game.creeps[i]) {
            delete Memory.creeps[i];
        }
    }

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

    var harvesters = _.filter(Game.creeps, (creep) => creep.memory.role == "harvester");
    var builders = _.filter(Game.creeps, (creep) => creep.memory.role == "builder");
    var upgraders = _.filter(Game.creeps, (creep) => creep.memory.role == "upgrader");
    var movers = _.filter(Game.creeps, (creep) => creep.memory.role == "mover");

    global.creepRoomMap = new Map();
    _.forEach(Game.rooms, (r) => {
        creepRoomMap.set(r.name + "builder", 0);
        creepRoomMap.set(r.name + "mover", 0);
        creepRoomMap.set(r.name + "upgrader", 0);
        creepRoomMap.set(r.name + "harvester", 0);
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

    roomOffset = 0;
    listOffset = 5;
    for (var room in Game.rooms) {
        r = Game.rooms[room];
        // if (!myRooms.includes(r.name)) {
        //     continue
        // }
        // Creep info
        new RoomVisual().text(r.name, 1, listOffset + roomOffset + 0.5, { align: "left", font: 0.5 });
        new RoomVisual().text(
            "🔋  ExcessEnergy: " + creepRoomMap.get(r.name + "eenergy"),
            1,
            listOffset + roomOffset + 1,
            { align: "left", font: 0.5 }
        );
        new RoomVisual().text(
            "⚡️ Energy      : " + r.energyAvailable + "/" + r.energyCapacityAvailable,
            1,
            listOffset + roomOffset + 1.5,
            { align: "left", font: 0.5 }
        );
        new RoomVisual().text(
            "⛏️ Harvesters  : " + creepRoomMap.get(r.name + "harvester"),
            1,
            listOffset + roomOffset + 2,
            { align: "left", font: 0.5 }
        );
        new RoomVisual().text(
            "🚚 Movers      : " + creepRoomMap.get(r.name + "mover"),
            1,
            listOffset + roomOffset + 2.5,
            { align: "left", font: 0.5 }
        );
        new RoomVisual().text(
            "👷 Builders    : " + creepRoomMap.get(r.name + "builder"),
            1,
            listOffset + roomOffset + 3,
            { align: "left", font: 0.5 }
        );
        new RoomVisual().text(
            "🚧 C sites     : " + creepRoomMap.get(r.name + "csites"),
            1,
            listOffset + roomOffset + 3.5,
            { align: "left", font: 0.5 }
        );
        new RoomVisual().text(
            "🔺Upgraders    : " + creepRoomMap.get(r.name + "upgrader"),
            1,
            listOffset + roomOffset + 4,
            { align: "left", font: 0.5 }
        );
        new RoomVisual().text(
            "HarvestExt    : " + creepRoomMap.get(r.name + "harvesterExt"),
            1,
            listOffset + roomOffset + 4.5,
            { align: "left", font: 0.5 }
        );
        new RoomVisual().text(
            "MoverExt    : " + creepRoomMap.get(r.name + "moverExt"),
            1,
            listOffset + roomOffset + 5,
            { align: "left", font: 0.5 }
        );
        roomOffset += 5;
    }

    global.nextSpawnOffset = 1;

    for (var room in Game.rooms) {
        r = Game.rooms[room];
        if (!myRooms.includes(r.name)) {
            continue;
        }
        if (Memory.createClaimer) {
            if (spawnCreep(roleClaimer, null, { memory: { baseRoomName: r.name } }, r.name) == 0) {
                Memory.createClaimer = false;
            }
        } else if (creepRoomMap.get(r.name + "harvester") < 1) {
            BaseBodyParts = [WORK, CARRY, CARRY, MOVE, MOVE];
            spawnCreep(roleHarvester, BaseBodyParts, null, r.name);
            continue;
        } else if (creepRoomMap.get(r.name + "mover") < 1) {
            BaseBodyParts = [CARRY, CARRY, CARRY, MOVE, MOVE];
            spawnCreep(roleMover, BaseBodyParts, null, r.name);
            continue;
        } else if (creepRoomMap.get(r.name + "harvester") < 3) {
            spawnCreep(roleHarvester, null, { memory: { baseRoomName: r.name } }, r.name);
            continue;
        } else if (creepRoomMap.get(r.name + "upgrader") < 1) {
            spawnCreep(roleUpgrader, null, { memory: { baseRoomName: r.name } }, r.name);
            continue;
        } else if (
            creepRoomMap.get(r.name + "builder") < creepRoomMap.get(r.name + "csites") / 2 &&
            creepRoomMap.get(r.name + "builder") < 3
        ) {
            spawnCreep(roleBuilder, null, { memory: { baseRoomName: r.name } }, r.name);
            continue;
        } else if (creepRoomMap.get(r.name + "mover") < 2) {
            spawnCreep(roleMover, null, { memory: { baseRoomName: r.name } }, r.name);
            continue;
        } else if (creepRoomMap.get(r.name + "upgrader") < 5 && creepRoomMap.get(r.name + "csites") < 1) {
            spawnCreep(roleUpgrader, null, { memory: { baseRoomName: r.name } }, r.name);
            continue;
        }
        // if (creepRoomMap.get(r.name+"upgrader") > 2) {
        //     // _.forEach(Game.creeps, c => { if(c.memory.role == 'harvester' && c.body.length == 5){ console.log(c.body.length)} } )
        //     c = _.find(Game.creeps, function(c) { if(c.memory.role == 'harvester' && c.body.length == 5){ return c } } )
        //     if(c) {
        //         c.memory.role = 'DIE'
        //     }
        // }

        // else if (r.name == "W16S21" && creepRoomMap.get(r.name+"harvesterExt") < 1) {
        //     spawnCreep(roleHarvesterExt, null, { memory: {baseRoomName: r.name }}, r.name);
        //     continue
        // }
        // else if (r.name == "W16S21" && creepRoomMap.get(r.name+"moverExt") < 2) {
        //     spawnCreep(roleMoverExt, null, { memory: {baseRoomName: r.name }}, r.name);
        //     continue
        // }
        nextSpawnOffset += 1;
    }
    // if (!Game.rooms["W17S21"].controller.my) {
    // spawnCreep(roleClaimer);
    // }

    if (spawn.spawning == true) {
        var spawningCreep = Game.creeps[spawn.spawning.name];
        spawn.room.visual.text("🛠️" + spawningCreep.name, spawn.pos.x + 1, spawn.pos.y, {
            align: "left",
            opacity: 0.8,
        });
    }

    for (var name in Game.creeps) {
        var creep = Game.creeps[name];
        try {
            if (creep.pos.x == 49) creep.move(7);
            if (creep.pos.y == 49) creep.move(1);
            if (creep.pos.x == 0) creep.move(3);
            if (creep.pos.y == 0) creep.move(5);

            if (creep.memory.role == "traveller") {
                roleTraveller.run(creep);
                continue;
            }
            // var closestHostile = creep.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
            // if (closestHostile) {
            //     roleDefence.run(creep)
            //     continue
            // }
            if (creep.memory.role == "upgrader" && harvesters.length < 1) {
                roleHarvester.run(creep);
                continue;
            }
            if (creep.memory.role == "harvester") {
                roleHarvester.run(creep, focusHealing);
            }
            if (creep.memory.role == "upgrader") {
                roleUpgrader.run(creep);
            }
            if (creep.memory.role == "builder") {
                roleBuilder.run(creep);
            }
            if (creep.memory.role == "claimer") {
                roleClaimer.run(creep);
            }
            if (creep.memory.role == "harvesterExt") {
                roleHarvesterExt.run(creep);
            }
            if (creep.memory.role == "moverExt") {
                roleMoverExt.run(creep);
            }
            if (creep.memory.role == "trucker") {
                roleTrucker.run(creep);
            }
            if (creep.memory.role == "soldier") {
                roleSoldier.run(creep);
            }
            if (creep.memory.role == "powHarvester") {
                rolePowHarvester.run(creep);
            }
            if (creep.memory.role == "powMover") {
                rolePowMover.run(creep);
            }
            if (creep.memory.role == "mover") {
                var droppedResource = creep.pos.findClosestByRange(FIND_DROPPED_RESOURCES, {
                    filter: (r) => r.amount >= 150,
                });
                var tombstoneResource = creep.pos.findClosestByRange(FIND_TOMBSTONES, {
                    filter: (r) => r.store.getUsedCapacity() >= 150,
                });
                if (droppedResource || tombstoneResource) {
                    if (droppedResource)
                        creep.room.visual.circle(droppedResource.pos, {
                            color: "red",
                            radius: 0.5,
                            lineStyle: "dashed",
                        });
                    if (tombstoneResource)
                        creep.room.visual.circle(tombstoneResource.pos, {
                            color: "red",
                            radius: 0.5,
                            lineStyle: "dashed",
                        });
                    // console.log(droppedResource.pos)
                    roleScavenger.run(creep);
                    continue;
                }
                // if (creepRoomMap.get(creep.memory.baseRoomName+"harvester") == 0) {
                //     roleHarvester.run(creep)
                //     continue
                // }
                roleMover.run(creep);
            }
            if (creep.memory.role == "DIE") {
                creep.moveTo(spawn.pos);
                if (spawn.recycleCreep(creep) != 0) {
                    creep.moveTo(spawn.pos);
                }
            }
        } catch (e) {}
    }

    // Renew
    for (var s in Game.spawns) {
        for (var i in Game.creeps) {
            if (Game.spawns[s].renewCreep(Game.creeps[i]) == 0) {
                Game.creeps[i].cancelOrder("move");
            }
        }
    }

    // Auto roads
    for (var room in Game.rooms) {
        r = Game.rooms[room];
        // console.log(r.name)
        if (!myRooms.includes(r.name)) {
            continue;
        }
        if (!r.controller) {
            continue;
        }
        if (r.controller.my) {
            var sources = r.find(FIND_SOURCES);
            for (var s of sources) {
                // console.log(s)
                r.visual.circle(s.pos, { fill: "blue", radius: 0.55 });
                // Sources to controller
                for (var pathStep of s.pos.findPathTo(r.controller.pos, {
                    ignoreCreeps: true,
                    ignoreRoads: true,
                    swampCost: 1,
                    range: 16,
                })) {
                    r.visual.circle(pathStep, {
                        color: "red",
                        lineStyle: "dashed",
                    });
                    if (
                        /*new Room.Terrain(room.name).get(pathStep.x, pathStep.y) == TERRAIN_MASK_SWAMP &&*/
                        r.lookForAt(LOOK_STRUCTURES, pathStep.x, pathStep.y).length == 0
                    ) {
                        // room.visual.circle(pathStep, {color: 'green', lineStyle: 'dashed'});
                        r.createConstructionSite(pathStep.x, pathStep.y, STRUCTURE_ROAD);
                    }
                }
                // Sources to spawns
                room_spawner = r.find(FIND_STRUCTURES, {
                    filter: (structure) => {
                        return structure.structureType == STRUCTURE_SPAWN;
                    },
                });
                r.visual.circle(room_spawner[0].pos, {
                    fill: "blue",
                    radius: 0.55,
                });
                if (room_spawner.length) {
                    for (var pathStep2 of s.pos.findPathTo(room_spawner[0].pos, {
                        ignoreCreeps: true,
                        ignoreRoads: false,
                        swampCost: 20,
                    })) {
                        // r.visual.circle(pathStep, {color: 'red', lineStyle: 'dashed'});
                        if (
                            new Room.Terrain(r.name).get(pathStep2.x, pathStep2.y) == TERRAIN_MASK_SWAMP &&
                            r.lookForAt(LOOK_STRUCTURES, pathStep2.x, pathStep2.y).length == 0
                        ) {
                            r.visual.circle(pathStep2, {
                                fill: "green",
                                radius: 0.55,
                            });
                            // r.createConstructionSite(pathStep2.x, pathStep2.y, STRUCTURE_ROAD);
                        }
                    }
                }
                // Source surroundings
                for (var i = s.pos.x - 2; i <= s.pos.x + 2; i++) {
                    for (var j = s.pos.y - 2; j <= s.pos.y + 2; j++) {
                        var surr = new RoomPosition(i, j, r.name);
                        if (new Room.Terrain(r.name).get(surr.x, surr.y) == TERRAIN_MASK_SWAMP) {
                            r.visual.circle(surr, { fill: "green" });
                            r.createConstructionSite(surr.x, surr.y, STRUCTURE_ROAD);
                        }
                    }
                }
                // Sources to spawns
                room_towers = r.find(FIND_STRUCTURES, {
                    filter: (structure) => {
                        return structure.structureType == STRUCTURE_TOWER;
                    },
                });
                // Source to towers
                for (var t of room_towers) {
                    for (var pathStep of s.pos.findPathTo(t.pos, {
                        ignoreCreeps: true,
                        ignoreRoads: false,
                        swampCost: 0.1,
                    })) {
                        r.visual.circle(pathStep, {
                            fill: "red",
                            lineStyle: "dashed",
                        });
                        if (
                            new Room.Terrain(r.name).get(pathStep.x, pathStep.y) != TERRAIN_MASK_SWAMP &&
                            r.lookForAt(LOOK_STRUCTURES, pathStep.x, pathStep.y).length == 0
                        ) {
                            r.visual.circle(pathStep, {
                                color: "green",
                                lineStyle: "dashed",
                            });
                            // r.createConstructionSite(pathStep.x, pathStep.y, STRUCTURE_ROAD);
                        }
                    }
                }
            }
        }
    }
};
