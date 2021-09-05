function log(creep, str) {
    if (0) if (creep.name == "MoverExt_814") console.log(str);
}

global.roleMoverExt = {
    name: "moverExt",
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
    bodyLoop: [MOVE, CARRY],

    /** @param {Creep} creep **/
    run: function (creep) {
        if(healRoads(creep) == OK)
            return
        var closestHostile = creep.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
        if (closestHostile) {
            creep.memory.fleeing = 20;
            const route = Game.map.findRoute(creep.room, creep.memory.baseRoomName);
            if (route.length > 0) {
                creep.say("Headin oot");
                const exit = creep.pos.findClosestByRange(route[0].exit);
                moveToTarget(creep, exit, true);
                return;
            }
        }
        if (creep.memory.fleeing > 0) {
            creep.memory.fleeing -= 1;
            moveToTarget(creep, creep.room.controller, true);
            return;
        }

        if (creep.memory.fakeBaseRoomName == undefined) {
            creep.memory.fakeBaseRoomName = creep.memory.baseRoomName;
        }
        if (creep.memory.banking == undefined) {
            creep.memory.banking = false;
            creep.memory.fakeBaseRoomName = creep.memory.targetRoomName;
        }

        if (creep.memory.banking && creep.store.getUsedCapacity() == 0) {
            creep.memory.banking = false;
            creep.memory.fakeBaseRoomName = creep.memory.targetRoomName;
            creep.say("m2harvester");
        }
        if (!creep.memory.banking && creep.store.getFreeCapacity() == 0) {
            creep.memory.banking = true;
            creep.memory.fakeBaseRoomName = creep.memory.baseRoomName;
            creep.say("m2storage");
        }

        if (creep.ticksToLive < 300) {
            creep.say("healing");
            creep.memory.healing = true;
            returnToHeal(creep, creep.memory.baseRoomName);
            return;
        }
        
        if(creep.memory.targetSource == undefined)
            console.log(creep.name, creep.pos)

        // if (creep.room.name != creep.memory.fakeBaseRoomName) {
        //     log(creep, "out of room");
        //     const route = Game.map.findRoute(creep.room, creep.memory.fakeBaseRoomName);
        //     if (route.length > 0) {
        //         creep.say("Headin oot");
        //         const exit = creep.pos.findClosestByRange(route[0].exit);
        //         moveToTarget(creep, exit, true);
        //     } else {
        //         creep.say("No route found");
        //     }
        //     return;
        // }

        log(creep, "in room");

        if (!creep.memory.banking) {
            log(creep, "collectin");
            log(creep, creep.memory.targetSource)

            var containers = Game.rooms[creep.memory.targetRoomName].find(FIND_STRUCTURES, {
                filter: (structure) => {
                    return (structure.structureType == STRUCTURE_STORAGE || structure.structureType == STRUCTURE_CONTAINER) && 
                        structure.pos.inRangeTo(Game.getObjectById(creep.memory.targetSource).pos, 2);
                },
            });
            // console.log(Game.getObjectById(creep.memory.targetSource))

            if (containers.length) {
                log(creep, "containers found")
                // var nearbySources = Game.rooms[creep.memory.targetRoomName].find(FIND_SOURCES, {
                //     filter: (s) => {
                //         return s.pos.inRangeTo(containers[0], 2)
                //     },
                // })
                // creep.memory.targetSource = nearbySources[0].id
                if (creep.withdraw(containers[0], RESOURCE_ENERGY) != OK) {
                    if(!creep.pos.inRangeTo(containers[0], 1))
                        moveToTarget(creep, containers[0]);
                }
            }
        } else {
            log(creep, "banking");
            var storages = Game.rooms[creep.memory.baseRoomName].find(FIND_STRUCTURES, {
                filter: (structure) => {
                    return (structure.structureType == STRUCTURE_STORAGE || structure.structureType == STRUCTURE_CONTAINER);
                },
            });
            log(creep, storages)
            if (storages.length) {
                if (creep.transfer(storages[0], RESOURCE_ENERGY) != OK) {
                    // console.log(1)
                    moveToMultiRoomTarget(creep, storages[0]);
                }
            } else creep.say("no eenergy");
        }
    },
};

module.exports = roleMoverExt;
