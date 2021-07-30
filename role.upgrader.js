require("movement");

function log(creep, str) {
    if (creep.room.name == "W19S21") console.log(str);
}

global.roleUpgrader = {
    name: "upgrader",
    roleMemory: { memory: {} },
    // memory: { baseRoomName: "W15S21" },
    BodyParts: [WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE],

    /** @param {Creep} creep **/
    run: function (creep) {
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
        var sources = creep.room.find(FIND_SOURCES);
        if (creep.memory.currentSource > sources.length - 1) {
            creep.memory.currentSource = 0;
        }

        // weird hack to keep it at the bottom source
        if (creep.room.name == "W16S21") {
            creep.memory.currentSource = 1;
        }

        if (creep.memory.upgrading && creep.store[RESOURCE_ENERGY] == 0) {
            creep.memory.upgrading = false;
            creep.say("🔄 harvest");
        }
        if (!creep.memory.upgrading && creep.store.getFreeCapacity() == 0) {
            creep.memory.upgrading = true;
            creep.say("⚡ upgrade");
        }

        if (creep.memory.upgrading) {
            if (creep.ticksToLive < 300) {
                creep.memory.healing = true;
                targets = creep.room.find(FIND_STRUCTURES, {
                    filter: (structure) => {
                        return structure.structureType == STRUCTURE_SPAWN;
                    },
                });
                target = targets[0];

                if (creep.transfer(target, RESOURCE_ENERGY) != OK) {
                    moveToTarget(creep, target, {
                        visualizePathStyle: { stroke: "#ffaa00" },
                    });
                }
            } else if (creep.upgradeController(creep.room.controller) == ERR_NOT_IN_RANGE) {
                moveToTarget(creep, creep.room.controller.pos, false);
                if (creep.store[RESOURCE_ENERGY] == 0) {
                    creep.memory.upgrading = false;
                }
            }
        } else {
            var targets = creep.room.find(FIND_STRUCTURES, {
                filter: (structure) => {
                    return (structure.structureType == STRUCTURE_STORAGE || structure.structureType == STRUCTURE_CONTAINER) && structure.store[RESOURCE_ENERGY] > 0 && structure.room.name != "W16S21";
                },
            });
            if (targets.length) {
                if (creepRoomMap.get(creep.room.name + "eenergy") < 800 && creep.room.energyAvailable < 800) {
                    moveToTarget(creep, creep.room.controller.pos, false);
                    return;
                } else {
                    if (creep.withdraw(targets[0], RESOURCE_ENERGY) != OK) {
                        moveToTarget(creep, targets[0].pos, false);
                    }
                }
            } else {
                var closeSources = creep.room.find(FIND_SOURCES, {
                    filter: (s) => {
                        return creep.room.controller.pos.inRangeTo(s, 15) == true;
                    },
                });
                if (closeSources.length > 0) {
                    if (creep.store.getFreeCapacity() > 0) {
                        if (creep.harvest(sources[creep.memory.currentSource]) == ERR_NOT_IN_RANGE) {
                            if (
                                moveToTarget(
                                    creep,
                                    sources[creep.memory.currentSource],
                                    {
                                        visualizePathStyle: {
                                            stroke: "#ffaa00",
                                        },
                                    },
                                    false
                                ) == ERR_NO_PATH
                            ) {
                                creep.memory.currentSource++;
                            }
                        }
                    }
                }
            }
        }
    },
};

module.exports = roleUpgrader;
