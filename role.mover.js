function log(creep, str) {
    if (creep.name == "MoverExt_577") if (0) console.log(str);
}

global.roleMover = {
    name: "mover",
    roleMemory: { memory: {} },
    // prettier-ignore
    BodyParts: [
        WORK,
        CARRY, CARRY, CARRY, CARRY, CARRY,
        CARRY, CARRY, CARRY, CARRY, CARRY,
        MOVE, MOVE, MOVE, MOVE, MOVE,
        MOVE, MOVE, MOVE, MOVE, MOVE,
        ],
    baseBodyParts: [WORK],
    bodyLoop: [CARRY, MOVE],

    /** @param {Creep} creep **/
    run: function (creep) {
        log(creep, 0);
        var sources = creep.room.find(FIND_SOURCES);

        // Lost creeps return home
        if (creep.room.name != creep.memory.baseRoomName) {
            if (creep.memory.experimentalMovement != undefined) {
                moveToRoom(creep, creep.memory.baseRoomName);
                return;
            }
            log(creep, 1);
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

        log(creep, 2);
        pickupNearby(creep);

        // we still must check for storage incase the storage is new and mainStorage still == a container
        // that way we can transition between the two structures
        //but we must do that outside of the moving/!moving loop
        var storage = creep.room.find(FIND_STRUCTURES).filter((structure) => {
            return structure.structureType == STRUCTURE_STORAGE && structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
        });
        mainStorage = Game.getObjectById(Memory.rooms[creep.room.name].mainStorage);

        log(creep, 4);
        if (creep.memory.moving == undefined) creep.memory.moving = true;
        if (creep.memory.moving && creep.store.getUsedCapacity() == 0) {
            log(creep, "setting moving false");
            creep.memory.moving = false;
            creep.say("🔄 harvest");
        }
        if (!creep.memory.moving && creep.store.getFreeCapacity() == 0) {
            log(creep, "setting moving true");
            creep.memory.moving = true;
            creep.say("dropping");
        }

        if ((creep.ticksToLive < 300 || creep.memory.healing) && (creep.memory.noHeal == undefined || creep.memory.noHeal != true)) {
            creep.say("healing");
            creep.memory.healing = true;
            if (returnToHeal(creep, creep.memory.baseRoomName)) return;
        }

        log(creep, 5);

        if (!creep.memory.moving) {
            log(creep, "retrieving");
            if (mainStorage == undefined) {
                log(creep, "mainStorage could not be found");
            } else {
                if (storage && mainStorage && storage != mainStorage) {
                    // transitioning
                    log(creep, "transitioning");
                    creep.memory.transitioning = true;
                }
                log(creep, "using mainStorage");
                if (mainStorage.store.getUsedCapacity(RESOURCE_ENERGY) == 0) {
                    // no energy, but can still store what is already withdrawn
                    creep.memory.moving = true;
                }
                if (creep.withdraw(mainStorage, RESOURCE_ENERGY) != OK) {
                    // console.log(creep.withdraw(targets[0], RESOURCE_ENERGY))
                    creep.moveTo(mainStorage, {
                        visualizePathStyle: { stroke: "#ffaa00" },
                        maxRooms: 0,
                    });
                }
            }
            return;
        } else {
            log(creep, "moving");
            var towers = creep.room.find(FIND_STRUCTURES).filter((structure) => {
                return structure.structureType == STRUCTURE_TOWER && structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
            });
            var closestHostile = creep.room.find(FIND_HOSTILE_CREEPS).filter((c) => {
                return c.body.find((part) => part.type == ATTACK) || c.body.find((part) => part.type == RANGED_ATTACK);
            });
            // console.log(closestHostile)
            if (closestHostile && towers.length) {
                log(creep, 6);
                if (creep.transfer(towers[0], RESOURCE_ENERGY) != OK) {
                    moveToTarget(creep, towers[0]);
                }
                return;
            }

            // transition from container to storage
            if (storage && mainStorage && mainStorage.structureType == STRUCTURE_CONTAINER) {
                log(creep, storage);
                if (creep.transfer(storage, RESOURCE_ENERGY) != OK) {
                    log(creep, creep.transfer(storage, RESOURCE_ENERGY));
                    log(creep, "dropping in storage");
                    moveToTarget(creep, storage);
                }
                return;
            }

            // repair if mainStorage is container
            if (mainStorage.structureType == STRUCTURE_CONTAINER) {
                if (mainStorage.hits < mainStorage.hitsMax / 2) {
                    if (creep.repair(mainStorage) == OK) {
                        return;
                    }
                }
            }

            var targets = creep.room.find(FIND_STRUCTURES).filter((structure) => {
                return (
                    ((structure.structureType == STRUCTURE_TOWER && Math.round((structure.store[RESOURCE_ENERGY] / structure.store.getCapacity([RESOURCE_ENERGY])) * 100) < 70) ||
                        structure.structureType == STRUCTURE_EXTENSION ||
                        structure.structureType == STRUCTURE_SPAWN) &&
                    structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0
                );
            });
            // creep.say('m2extTower');

            if (Memory.rooms[creep.room.name].mainSpawn.refilling) {
                mainSpawn = Game.getObjectById(Memory.rooms[creep.room.name].mainSpawn.id);
                targets = targets.filter((item) => item !== mainSpawn);
            }

            if (!targets.length) {
                // creep.say('m2Tower');
                targets = creep.room.find(FIND_STRUCTURES).filter((structure) => {
                    return structure.structureType == STRUCTURE_TOWER && structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
                });
            }

            // add a send link if it is available to the target array
            try {
                if (creep.room.memory.l_from != undefined) {
                    log(creep, 7);
                    log(creep, Memory.rooms[creep.room.name]);
                    log(creep, Memory.rooms[creep.room.name].l_from);
                    var l_from = Game.getObjectById(Memory.rooms[creep.room.name].l_from);
                    if (l_from != undefined && l_from.store.getFreeCapacity(RESOURCE_ENERGY) > 0) {
                        log(creep, "pushing l_from");
                        log(creep, targets.length);
                        log(creep, l_from);
                        targets.push(l_from);
                        log(creep, targets.length);
                    }
                }
            } catch (e) {
                console.log("error");
            }

            if (!targets.length) {
                // No targets found, return to the storage
                creep.say("no targets");
                try {
                    log(creep, 8);
                    moveToTarget(creep, mainStorage);
                    return;
                } catch (error) {
                    console.log(error);
                }
            }
            target = creep.pos.findClosestByPath(targets);
            if (target.structureType == STRUCTURE_SPAWN) Memory.rooms[creep.room.name].mainSpawn.refilling = true;

            for (const resourceType in creep.store) {
                log(creep, 9);
                if (creep.transfer(target, resourceType) != OK) {
                    moveToTarget(creep, target, true);
                }
                return;
            }
        }
    },
};

module.exports = roleMover;
