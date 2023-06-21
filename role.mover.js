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
    baseBodyParts: [WORK, CARRY, MOVE, CARRY, MOVE],
    bodyLoop: [MOVE, CARRY],
    bodyPartsMaxCount: 21,

    /** @param {Creep} creep **/
    run: function (creep) {
        creep.memory.debug = false
        if (creep.memory.returning == undefined) {
            creep.memory.returning = true;
        }

        mainStorage = Game.getObjectById(Memory.rooms[creep.memory.baseRoomName].mainStorage);
        if (mainStorage == null) {
            console.log(`${creep}: mainStorage could not be found`);
            // resetMainStorage(creep.memory.baseRoomName);
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
                return roleHarvester.run(creep);
            } else {

                if (mainStorage.structureType == STRUCTURE_CONTAINER) {
                    if (creep.body.some(e => e.type == WORK) && mainStorage.hits < mainStorage.hitsMax / 2) {
                        Log(creep, "healing storage")
                        if (creep.repair(mainStorage) == ERR_NOT_IN_RANGE) {
                            creep.Move(mainStorage.pos);
                        }
                        return;
                    }
                }
    
                if (mainStorage.store.getFreeCapacity() ) {
                    for (const resourceType in creep.store) {
                        if (creep.transfer(mainStorage, resourceType) != OK) {
                            Log(creep, creep.transfer(mainStorage, resourceType));
                            creep.Move(mainStorage);
                        }
                    }
                } else {
                    Log(creep, `${creep.name} falling back to other roles`);
                    if ((creep.memory.noFallback == undefined || creep.memory.noFallback != true) && creep.body.includes(WORK)) {
                        return roleHarvester.run(creep);
                    }
                }
            }
        } else {
            Log(creep, "returning");
            if (pickupNearby(creep) == OK) {
                return
            }
            if (creep.memory.targetContainer == undefined) {
                Log(creep, "finding new container");

                var containers = creep.room.find(FIND_STRUCTURES).filter((structure) => structure.structureType == STRUCTURE_CONTAINER && structure.store.getUsedCapacity() > 0 && structure != mainStorage);
                if (containers.length) {
                    containers.sort((a, b) => b.store.getUsedCapacity() - a.store.getUsedCapacity());
                    creep.memory.targetContainer = containers[0].id;
                    creep.memory.targetSource = containers[0].pos.findClosestByRange(FIND_SOURCES).id;
                }
            }

            target = Game.getObjectById(creep.memory.targetContainer);
            if (target == null) {
                delete creep.memory.targetContainer;
                if (Memory.rooms[creep.memory.baseRoomName].sources[creep.memory.targetSource] != undefined && Memory.rooms[creep.memory.baseRoomName].sources[creep.memory.targetSource].container != undefined) {
                    creep.memory.targetContainer = Memory.rooms[creep.memory.baseRoomName].sources[creep.memory.targetSource].container.id;
                    target = Game.getObjectById(creep.memory.targetContainer);
                } else {
                    console.log(`${creep} has lost it's target container. retiring.`);
                    // creep.memory.DIE = true;
                }
            }

            if (target == null) {
                console.log("moving to sourcce")
                target = Game.getObjectById(creep.memory.targetSource)
                var droppedEnergy = target.pos.findInRange(FIND_DROPPED_RESOURCES, 3);
                droppedEnergy.sort((a, b) => b.amount - a.amount);
                creep.Move(droppedEnergy[0]);
                return
            }

            if (creep.memory.targetSource == undefined) {
                creep.memory.targetSource = target.pos.findClosestByRange(FIND_SOURCES).id;
            }

            // if (
            //     creep.room.controller.level >= 6 &&
            //     Memory.rooms[creep.memory.baseRoomName].sources[creep.memory.targetSource] != undefined &&
            //     Memory.rooms[creep.memory.baseRoomName].sources[creep.memory.targetSource].link != undefined && // mineral sources won't have a sources entry or link
            //     target.store.getUsedCapacity() == 0
            // ) {
            //     creep.memory.DIE = {};
            // }

            if (target.store.getUsedCapacity() > 0) {
                for (const resourceType in target.store) {
                    Log(creep, 9);
                    if (creep.withdraw(target, resourceType) != OK) {
                        creep.Move(target);
                    }
                }
            } else {
                Log(creep, "moving straight to target");
                target = Game.getObjectById(creep.memory.targetSource)
                var droppedEnergy = target.pos.findInRange(FIND_DROPPED_RESOURCES, 3);
                droppedEnergy.sort((a, b) => b.amount - a.amount);
                creep.Move(droppedEnergy[0]);
            }
        }
    },
};

module.exports = roleMover;
