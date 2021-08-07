function log(creep, str) {
    // if (creep.name == "Harvester_393")
    if (0) console.log(str);
}

global.roleHarvester = {
    name: "harvester",
    roleMemory: { memory: {} },
    // prettier-ignore
    BodyParts: [
        WORK, WORK, WORK, WORK, WORK,
        WORK, WORK, WORK, WORK, WORK,
        WORK, WORK, WORK, WORK, WORK,
        CARRY, CARRY, CARRY, CARRY, CARRY,
        MOVE, MOVE, MOVE, MOVE, MOVE,
        ],

    /** @param {Creep} creep **/
    run: function (creep, focusHealing) {
        var sources = creep.room.find(FIND_SOURCES);
        if (!creep.memory.currentSource) {
            creep.memory.currentSource = 0;
        }
        if (creep.memory.mining == undefined) {
            creep.memory.mining = true;
        }

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

        // Bad hack to split the upgraders and the harvesters
        // creep.memory.currentSource = 0

        if (creep.memory.mining && creep.store.getFreeCapacity() == 0) {
            creep.memory.mining = false;
            creep.say("🔄 dropping");
        }
        if (!creep.memory.mining && creep.store[RESOURCE_ENERGY] == 0) {
            creep.memory.mining = true;
            creep.say("⛏️ mining");
        }

        if (creep.memory.mining) {
            if (creep.harvest(sources[creep.memory.currentSource]) == ERR_NOT_IN_RANGE) {
                let ret = creep.moveTo(sources[creep.memory.currentSource], {
                    visualizePathStyle: { stroke: "#ffaa00" },
                });
                // if(ret != OK) {
                //     console.log(ret)
                // }
                if (ret == ERR_NO_PATH) {
                    creep.memory.currentSource++;
                    if (creep.memory.currentSource > sources.length - 1) {
                        creep.memory.currentSource = 0;
                    }
                }
            }
        } else {
            var targets = creep.room.find(FIND_STRUCTURES, {
                filter: (structure) => {
                    return (
                        (structure.structureType == STRUCTURE_EXTENSION || structure.structureType == STRUCTURE_SPAWN || structure.structureType == STRUCTURE_TOWER || structure.structureType == STRUCTURE_STORAGE) &&
                        structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0
                    );
                },
            });
            var towers = creep.room.find(FIND_STRUCTURES, {
                filter: (structure) => {
                    return structure.structureType == STRUCTURE_TOWER && structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
                },
            });
            focusHealing = false;
            if (targets.length > 0) {
                var target = null;
                //Priority is
                /* 
                    1. itself
                    2. the colony
                    3. healing
                    4. speed
                */
                if (creep.ticksToLive < 500) {
                    log(creep, "healing");
                    creep.memory.healing = true;
                    targets = creep.room.find(FIND_STRUCTURES, {
                        filter: (structure) => {
                            return structure.structureType == STRUCTURE_SPAWN;
                        },
                    });
                    target = targets[0];
                    moveToTarget(creep, target.pos, true);
                    creep.transfer(target, RESOURCE_ENERGY);
                    return;
                } else {
                    // If we have Movers, just use the storage
                    if (creepRoomMap.get(creep.room.name + "mover") != undefined && creepRoomMap.get(creep.room.name + "mover") > 0) {
                        log(creep, "movers found");
                        targets = creep.room.find(FIND_STRUCTURES, {
                            filter: (structure) => {
                                return structure.structureType == STRUCTURE_STORAGE && structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
                            },
                        });
                        if (!targets.length) {
                            log(creep, "no storage found");
                            targets = creep.room.find(FIND_STRUCTURES, {
                                filter: (structure) => {
                                    return (structure.structureType == STRUCTURE_CONTAINER || structure.structureType == STRUCTURE_SPAWN) && structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
                                },
                            });

                            if (!targets.length) {
                                log(creep, "no container found");
                            } else target = targets[0];
                            moveToTarget(creep, target.pos, true);
                            return;
                        }
                    } else {
                        log(creep, "no movers found");
                        targets = creep.room.find(FIND_STRUCTURES, {
                            filter: (structure) => {
                                return (structure.structureType == STRUCTURE_EXTENSION || structure.structureType == STRUCTURE_SPAWN || structure.structureType == STRUCTURE_CONTAINER) && structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
                            },
                        });
                        if (!targets.length) {
                            log(creep, "no exts, spawn, or container found");
                            targets = towers;
                        }
                        // console.log(targets)
                    }
                    target = creep.pos.findClosestByPath(targets);
                    log(creep, `target: ${target}`);
                }

                if (creep.transfer(target, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    moveToTarget(creep, target.pos, true);
                }
            }
        }
    },
};

module.exports = roleHarvester;
