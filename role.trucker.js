function Log(str) {
    if (0) console.log(str);
}

global.roleTrucker = {
    name: "trucker",
    roleMemory: { memory: { targetRoomName: null } },
    // prettier-ignore
    BodyParts: [CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE],
    baseBodyParts: [],
    bodyLoop: [CARRY, MOVE, MOVE, MOVE, MOVE, MOVE],
    bodyPartsMaxCount: 30,

    /** @param {Creep} creep **/
    run: function (creep) {
        if (creep.memory.returning == undefined) {
            creep.memory.returning = true;
        }

        if (creep.memory.returning && creep.store.getFreeCapacity() == 0) {
            creep.memory.returning = false;
            creep.say("m2dest");
        }
        if (!creep.memory.returning && creep.store.getUsedCapacity() == 0) {
            creep.memory.returning = true;
            creep.memory.healing = true;
            creep.say("m2home");
        }

        if ((creep.ticksToLive < 300 || creep.memory.healing) && (creep.memory.noHeal == undefined || creep.memory.noHeal != true)) {
            creep.say("healing");
            creep.memory.healing = true;
            if (returnToHeal(creep, creep.memory.baseRoomName)) return;
        }

        if (!creep.memory.returning) {
            
            // if (creep.room.name != creep.memory.targetRoomName) {
            //     creep.moveTo(creep.memory.targetRoomName)
            //     return
            // }
            var target = Game.getObjectById(Memory.rooms[creep.memory.targetRoomName].mainStorage);
            if (target != undefined && target.store.getFreeCapacity > 50) {
                if (creep.transfer(target, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(target, {
                        visualizePathStyle: { stroke: "#ffaa00" },
                    });
                }
            } else if (creep.memory.dumper != undefined || creep.memory.dumper == true) {
                var target = Game.getObjectById(Memory.rooms[creep.memory.targetRoomName].mainSpawn.id);
                if (creep.room.name != creep.memory.targetRoomName) {
                    moveToTarget(creep, target)
                    return
                }
                if (creep.room.controller.level < 2 ) {
                creeps = creep.room.find(FIND_MY_CREEPS).filter((c) => {
                    return c.memory.role == 'harvester';
                })
                } else {
                    creeps = creep.room.find(FIND_MY_CREEPS).filter((c) => {
                    return c.memory.role == 'upgrader';
                })
                }
                if (creeps.length) {
                    targetCreep = creep.pos.findClosestByRange(creeps)
                    // console.log(targetCreep)
                    if (creep.transfer(targetCreep, RESOURCE_ENERGY) != OK) {
                        creep.moveTo(targetCreep)
                    }
                }
                
                
            }
        } else {
            var target = Game.getObjectById(Memory.rooms[creep.memory.baseRoomName].mainStorage);
            if (creep.withdraw(target, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                creep.moveTo(target, {
                    visualizePathStyle: { stroke: "#ffaa00" },
                });
            }
        }
    },
};

module.exports = roleTrucker;
