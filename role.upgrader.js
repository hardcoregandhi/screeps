require("movement");

function log(creep, str) {
    if (0) if (creep.name === "Upgrader_758") console.log(str);
}

global.roleUpgrader = {
    name: "upgrader",
    roleMemory: { memory: {} },
    // memory: { baseRoomName: "W15S21" },
    // prettier-ignore
    BodyParts: [
        WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK,
        CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY,
        MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE,
        ],
    baseBodyParts: [WORK, CARRY, CARRY, MOVE, MOVE],
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
        var sources = creep.room.find(FIND_SOURCES);
        if (creep.memory.currentSource > sources.length - 1) {
            creep.memory.currentSource = 0;
        }

        // weird hack to keep it at the bottom source
        if (creep.room.name == "W16S21") {
            creep.memory.currentSource = 1;
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

        if (creep.ticksToLive < 300) {
            creep.say("healing");
            creep.memory.healing = true;
            // creep.drop(RESOURCE_ENERGY);
            if (returnToHeal(creep, creep.memory.baseRoomName))
                return;
        }

        pickupNearby(creep);

        if (creep.memory.upgrading) {
            log(creep, 2);
            var spawns = creep.room.find(FIND_STRUCTURES, {
                filter: (structure) => {
                    return structure.structureType == STRUCTURE_SPAWN;
                },
            });
            if (creep.ticksToLive < 300 && spawns.length) {
                creep.memory.healing = true;
                targets = creep.room.find(FIND_STRUCTURES, {
                    filter: (structure) => {
                        return structure.structureType == STRUCTURE_SPAWN;
                    },
                });
                target = targets[0];

                if (creep.transfer(target, RESOURCE_ENERGY) != OK) {
                    moveToTarget(creep, target, false);
                }
            } else {
                healRoads(creep);
                if (creep.upgradeController(creep.room.controller) == ERR_NOT_IN_RANGE) {
                    moveToTarget(creep, creep.room.controller.pos, false);
                    creep.moveTo(creep.room.controller.pos);
                    if (creep.store[RESOURCE_ENERGY] == 0) {
                        creep.memory.upgrading = false;
                    }
                }
            }
        } else {
            var targets = creep.room.find(FIND_STRUCTURES, {
                filter: (structure) => {
                    return (structure.structureType == STRUCTURE_STORAGE) && structure.store[RESOURCE_ENERGY] > 0 && structure.room.name != "W16S21";
                },
            });
            var links = creep.room.find(FIND_STRUCTURES, {
                filter: (structure) => {
                    return structure.structureType == STRUCTURE_LINK;
                },
            });
            if (links.length == 2) {
                try {
                    var l_to = Game.getObjectById(Memory.rooms[creep.room.name].l_to);
                    if (l_to && l_to.store.getUsedCapacity(RESOURCE_ENERGY) > 0) {
                        creep.say("h2link");
                        if (creep.withdraw(l_to, RESOURCE_ENERGY) != OK) {
                            moveToTarget(creep, l_to);
                        }
                        moveToTarget(creep, l_to);
                        return;
                    }
                } catch (error) {
                    console.log(error);
                    console.trace();
                }
            }
            if (targets.length && links.length != 2) {
                if (creepRoomMap.get(creep.room.name + "eenergy") < 2000 || creep.room.energyAvailable < creep.room.energyCapacityAvailable - 400) {
                    moveToTarget(creep, creep.room.controller.pos, false);
                    return;
                } else {
                    if (creep.withdraw(targets[0], RESOURCE_ENERGY) != OK) {
                        moveToTarget(creep, targets[0].pos, false);
                    }
                }
            } else {
                var containers = creep.room.find(FIND_STRUCTURES, {
                    filter: (structure) => {
                        return (structure.structureType == STRUCTURE_CONTAINER) && structure.store.getUsedCapacity() > 0;
                    },
                });
                log(creep, containers)
                if(containers.length) {
                    container = creep.pos.findClosestByPath(containers)
                    if(creep.withdraw(container, RESOURCE_ENERGY) != OK) {
                        creep.moveTo(container,{
                            visualizePathStyle: {
                                stroke: "#ffaa00",
                            },
                        })
                    }
                    return
                }
                var closeSources = creep.room.find(FIND_SOURCES, {
                    filter: (s) => {
                        return creep.room.controller.pos.inRangeTo(s, 9) == true && s.energy > 0;
                    },
                });
                if (creepRoomMap.get(creep.room.name + "mover") == 0) {
                    closeSources = creep.room.find(FIND_SOURCES);
                }
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
                } else {
                    log(creep, 666);
                    if(creep.store.getUsedCapacity() != 0)
                        creep.memory.upgrading = true

                    moveToTarget(creep, creep.room.controller.pos, false);
                }
            }
        }
    },
};

module.exports = roleUpgrader;
