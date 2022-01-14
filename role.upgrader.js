require("movement");

function log(creep, str) {
    if (1) if (creep.name === "Builder_576") console.log(str);
}

global.roleUpgrader = {
    name: "upgrader",
    roleMemory: { memory: {} },
    // memory: { baseRoomName: "W15S21" },
    // prettier-ignore
    BodyParts: [
        WORK, WORK, WORK, WORK, WORK,
        CARRY, CARRY, CARRY, CARRY, CARRY,
        MOVE, MOVE, MOVE, MOVE, MOVE,
        ],
    baseBodyParts: [],
    bodyLoop: [WORK, CARRY, MOVE],
    /** @param {Creep} creep **/
    run: function (creep) {
        log(creep, "run");
        // Lost creeps return home
        if (creep.room.name != creep.memory.baseRoomName) {
            const route = Game.map.findRoute(creep.room, creep.memory.baseRoomName);
            if (route.length > 0) {
                creep.say("Headin oot");
                const exit = creep.pos.findClosestByRange(route[0].exit);
                creep.moveTo(exit, {
                    visualizePathStyle: { stroke: "#ffffff" },
                });
            } else {
                creep.say("No route found");
            }
            return;
        }

        if (creep.memory.upgrading == undefined) {
            creep.memory.upgrading = false;
        }

        if (creep.memory.upgrading && creep.store[RESOURCE_ENERGY] == 0) {
            creep.memory.upgrading = false;
            creep.say("🔄 harvest");
        }
        if (!creep.memory.upgrading && creep.store.getFreeCapacity() == 0) {
            creep.memory.upgrading = true;
            creep.say("⚡ upgrade");
        }
        log(creep, 1);

        if ((creep.ticksToLive < 300 || creep.memory.healing) && (creep.memory.noHeal == undefined || creep.memory.noHeal != true)) {
            creep.say("healing");
            creep.memory.healing = true;
            if (returnToHeal(creep, creep.memory.baseRoomName)) return;
        }

        pickupNearby(creep);

        var mainStorage = Game.getObjectById(Memory.rooms[creep.room.name].mainStorage);

        if (creep.memory.upgrading) {
            log(creep, "upgrading");

            healRoads(creep);

            if (creep.room.controller.level == 8) {
                log(creep, "controller is level 8")
                if (creep.memory.sweetSpot == undefined) {
                    log(creep, "sweet spot undefined")
                    controllerSpots = [];
                    const terrain = room.getTerrain();
                    log(creep, "painting controller spots")
                    r = creep.room
                    for (var i = r.controller.pos.x - 1; i <= r.controller.pos.x + 1; i++) {
                        for (var j = r.controller.pos.y - 1; j <= r.controller.pos.y + 1; j++) {
                            // r.visual.circle(i, j, { fill: "red", lineStyle: "dashed" , radius: 0.55 });
                            if (
                                // any edges
                                i == r.controller.pos.x - 1 ||
                                i == r.controller.pos.x + 1 ||
                                j == r.controller.pos.y - 1 ||
                                j == r.controller.pos.y + 1
                            ) {
                                if (terrain.get(i, j) != TERRAIN_MASK_WALL) {
                                    r.visual.circle(i, j, { fill: "green", lineStyle: "dashed", radius: 0.55 });
                                    controllerSpots.push(new RoomPosition(i, j, r.name));
                                }
                            }
                        }
                    }
                    var link_controller = Game.getObjectById(Memory.rooms[creep.memory.baseRoomName].link_controller);
                    linkSpots = [];
                    log(creep, "painting link spots")
                    for (var i = link_controller.pos.x - 1; i <= link_controller.pos.x + 1; i++) {
                        for (var j = link_controller.pos.y - 1; j <= link_controller.pos.y + 1; j++) {
                            // r.visual.circle(i, j, { fill: "red", lineStyle: "dashed" , radius: 0.55 });
                            if (
                                // any edges
                                i == link_controller.pos.x - 1 ||
                                i == link_controller.pos.x + 1 ||
                                j == link_controller.pos.y - 1 ||
                                j == link_controller.pos.y + 1
                            ) {
                                if (terrain.get(i, j) != TERRAIN_MASK_WALL) {
                                    r.visual.circle(i, j, { fill: "green", lineStyle: "dashed", radius: 0.55 });
                                    linkSpots.push(new RoomPosition(i, j, r.name));
                                }
                            }
                        }
                    }
                    const intersectionSpots = controllerSpots.filter((value) => linkSpots.includes(value));
                    if (intersectionSpots.length) {
                        log(creep, "intersection found")
                        creep.memory.sweetSpot = intersectionSpots[0];
                    }
                } else {
                    moveToTarget(creep, creep.memory.sweetSpot, false);
                }

                if (creep.room.controller.ticksToDowngrade >= 200000) {
                    creep.memory.DIE = {};
                }
            }
            if (creep.upgradeController(creep.room.controller) != OK) {
                moveToTarget(creep, creep.room.controller.pos, false);
            }
        } else {
            log(creep, "retrieving");

            if (Memory.rooms[creep.memory.baseRoomName].link_storage != undefined && Memory.rooms[creep.memory.baseRoomName].link_controller != undefined) {
                try {
                    log(creep, "links");
                    var link_controller = Game.getObjectById(Memory.rooms[creep.memory.baseRoomName].link_controller);
                    if (link_controller /*&& link_controller.store.getUsedCapacity(RESOURCE_ENERGY) > 0*/) {
                        creep.say("h2link");
                        log(creep, "h2link");
                        if (link_controller.store.getUsedCapacity(RESOURCE_ENERGY) == 0) {
                            creep.memory.upgrading = true;
                        } else if (creep.withdraw(link_controller, RESOURCE_ENERGY) != OK) {
                            moveToTarget(creep, link_controller);
                        }
                        moveToTarget(creep, link_controller);
                        return;
                    }
                } catch (e) {
                    console.log(`${creep}: ${e}`);
                }
            }
            if (mainStorage != undefined) {
                log(creep, "mainStorage");
                if (
                    (creepRoomMap.get(creep.room.name + "eenergy") < 2000 && creep.room.energyAvailable < creep.room.energyCapacityAvailable - 400) ||
                    (mainStorage.structureType == STRUCTURE_CONTAINER && mainStorage.store.getUsedCapacity() < mainStorage.store.getCapacity() / 2)
                ) {
                    moveToTarget(creep, creep.room.controller.pos, false);
                    return;
                } else {
                    if (creep.withdraw(mainStorage, RESOURCE_ENERGY) != OK) {
                        moveToTarget(creep, mainStorage.pos, false);
                    }
                }
            }
        }
    },
};

module.exports = roleUpgrader;
