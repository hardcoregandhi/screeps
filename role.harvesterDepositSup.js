global.roleMover = {
    name: "harvSup",
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
    bodyPartsMaxCount: 21,

    /** @param {Creep} creep **/
    run: function (creep) {
        if (creep.memory.returning == undefined) {
            creep.memory.returning = true;
        }

        mainStorage = Game.getObjectById(Memory.rooms[creep.memory.baseRoomName].mainStorage);
        if (mainStorage == null) {
            console.log(`${creep}: mainStorage could not be found`);
            resetMainStorage(creep.memory.baseRoomName);
        }

        if (creep.memory.returning && creep.store.getFreeCapacity() == 0) {
            creep.memory.returning = false;
            creep.say("m2dest");
        }
        if (!creep.memory.returning && creep.store.getUsedCapacity() == 0) {
            creep.memory.returning = true;
            creep.say("m2home");
        }

        if ((creep.ticksToLive < 200 || creep.memory.healing) && (creep.memory.noHeal == undefined || creep.memory.noHeal != true)) {
            creep.say("healing");
            if (upgradeCreep(creep.name) == 0) {
                return;
            }
            creep.memory.healing = true;
            if (returnToHeal(creep, creep.memory.baseRoomName)) return;
        }

        if (!creep.memory.returning) {
            Log(creep, "retrieving");
            if (healRoads(creep) == OK) {
                Log(creep, "healing roads");
                return;
            }

            if (mainStorage == null) {
                Log(creep, "falling back to building");
                return roleBuilder.run(creep);
            }

            if (mainStorage.structureType == STRUCTURE_CONTAINER) {
                if (mainStorage.hits < mainStorage.hitsMax / 2) {
                    if (creep.repair(mainStorage) == ERR_NOT_IN_RANGE) {
                        creep.Move(mainStorage.pos);
                    }
                    return;
                }
            }

            if (mainStorage.store.getFreeCapacity() > 50) {
                for (const resourceType in creep.store) {
                    if (creep.transfer(mainStorage, resourceType) != OK) {
                        Log(creep, creep.transfer(mainStorage, resourceType));
                        creep.Move(mainStorage);
                    }
                }
            } else {
                Log(creep, `${creep.name} falling back to other roles`);
                fallbackToOtherRoles(creep);
            }
        } else {
            Log(creep, "returning");
            if (pickupNearby(creep) == OK) {
                return;
            }
            
            if (creep.memory.targetContainer == undefined) {
                Log(creep, "finding new container");

                var containers = creep.room.find(FIND_STRUCTURES).filter((structure) => structure.structureType == STRUCTURE_CONTAINER && structure.store.getUsedCapacity() > 0 && structure != mainStorage);
                if (!containers.length) return -1;

                containers.sort((a, b) => b.store.getUsedCapacity() - a.store.getUsedCapacity());
                creep.memory.targetContainer = containers[0].id;
                creep.memory.targetSource = containers[0].pos.findClosestByRange(FIND_SOURCES).id;
            }

            target = Game.getObjectById(creep.memory.targetContainer);
            if (creep.memory.targetSource == undefined) {
                creep.memory.targetSource = target.pos.findClosestByRange(FIND_SOURCES).id;
            }

            if (creep.room.controller.level >= 6 && Memory.rooms[creep.memory.baseRoomName].sources[creep.memory.targetSource].link != undefined && target.store.getUsedCapacity() == 0) {
                creep.memory.DIE = {};
            }

            if (target.store.getUsedCapacity() > 0) {
                for (const resourceType in target.store) {
                    Log(creep, 9);
                    if (creep.withdraw(target, resourceType) != OK) {
                        creep.Move(target);
                    }
                }
            } else {
                Log(creep, "moving straight to target");
                if (!creep.pos.isNearTo(target)) creep.Move(target);
            }
        }
    },
};

module.exports = roleMover;
