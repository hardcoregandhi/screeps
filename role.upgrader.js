require("movement");

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
    baseBodyParts: [MOVE, WORK, CARRY, MOVE],
    bodyLoop: [WORK, CARRY, MOVE],
    /** @param {Creep} creep **/
    run: function (creep) {
        Log(creep, "roleUpgrader")

        Log(creep, "run");
        // Lost creeps return home
        if (creep.room.name != creep.memory.baseRoomName) {
            moveToMultiRoomTarget(creep, new RoomPosition(25, 25, creep.memory.baseRoomName))
            return
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
        Log(creep, 1);

        if ((creep.ticksToLive < 300 || creep.memory.healing) && (creep.memory.noHeal == undefined || creep.memory.noHeal != true)) {
            creep.say("healing");
            creep.memory.healing = true;
            if (upgradeCreep(creep.name) == 0) {
                return;
            }
            if (returnToHeal(creep, creep.memory.baseRoomName)) return;
        }

        // pickupNearby(creep);

        var mainStorage = Game.getObjectById(Memory.rooms[creep.room.name].mainStorage);
        if (mainStorage == null && creep.room.controller.level > 1 && creep.room.find(FIND_CONSTRUCTION_SITES).length != 0) {
            roleBuilder.run(creep);
            return;
        }

        if (creep.memory.upgrading) {
            Log(creep, "upgrading");

            if (healRoads(creep) == OK) return;

            if (creep.room.controller.level == 8) {
                Log(creep, "controller is level 8");
                if (creep.memory.sweetSpot == undefined) {
                    Log(creep, "sweet spot undefined");
                    controllerSpots = [];
                    const terrain = room.getTerrain();
                    Log(creep, "painting controller spots");
                    r = creep.room;
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
                    Log(creep, "painting link spots");
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
                        Log(creep, "intersection found");
                        creep.memory.sweetSpot = intersectionSpots[0];
                    }
                } else {
                    moveToTarget(creep, creep.memory.sweetSpot);
                }

                if (creep.room.controller.ticksToDowngrade >= 200000) {
                    creep.memory.DIE = {};
                }
            }
            Log(creep, "upgrading controller")
            if (creep.upgradeController(creep.room.controller) != OK) {
                if (!creep.pos.inRangeTo(creep.room.controller, 4))
                    moveToMultiRoomTarget(creep, creep.room.controller.pos, {range: 3});
                else
                    moveToMultiRoomTargetAvoidCreep(creep, creep.room.controller.pos, {range: 3});

            }
        } else {
            Log(creep, "retrieving");

            if (Memory.rooms[creep.memory.baseRoomName].link_storage != undefined && Memory.rooms[creep.memory.baseRoomName].link_controller != undefined) {
                try {
                    Log(creep, "links");
                    var link_controller = Game.getObjectById(Memory.rooms[creep.memory.baseRoomName].link_controller);
                    if (link_controller /*&& link_controller.store.getUsedCapacity(RESOURCE_ENERGY) > 0*/) {
                        creep.say("h2link");
                        Log(creep, "h2link");
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
                Log(creep, "mainStorage");
                if (
                    (creepRoomMap.get(creep.room.name + "eenergy") < 2000 && creep.room.energyAvailable < creep.room.energyCapacityAvailable - 400) ||
                    (mainStorage.structureType == STRUCTURE_CONTAINER && mainStorage.store.getUsedCapacity() < mainStorage.store.getCapacity() / 2)
                ) {
                    moveToTarget(creep, creep.room.controller.pos);
                    return;
                } else {
                    if (creep.withdraw(mainStorage, RESOURCE_ENERGY) != OK) {
                        moveToMultiRoomTarget(creep, mainStorage.pos);
                    }
                }
            }
        }
    },
};

module.exports = roleUpgrader;
