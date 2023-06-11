function Log(str) {
    if (0) console.log(str);
}

global.roleTrucker = {
    name: "trucker",
    roleMemory: { memory: { targetRoomName: null } },
    // prettier-ignore
    BodyParts: [CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE],
    baseBodyParts: [],
    bodyLoop: [CARRY, MOVE],
    bodyPartsMaxCount: 30,

    /** @param {Creep} creep **/
    run: function (creep) {
        // creep.memory.DIE = true
        Log(creep, "run()")
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
delete creep.memory.targetCreep 
        if (!creep.memory.returning) {
            Log(creep, "!returning")
            
            // if (creep.room.name != creep.memory.targetRoomName) {
            //     creep.moveTo(creep.memory.targetRoomName)
            //     return
            // }
            var target = Game.getObjectById(Memory.rooms[creep.memory.targetRoomName].mainStorage);
            if (target != undefined && target.store.getFreeCapacity() > 50) {
                if (creep.transfer(target, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(target, {
                        visualizePathStyle: { stroke: "#ffaa00" },
                    });
                }
                return
            } else {
                if (creep.room.name != creep.memory.targetRoomName) {
                    moveToMultiRoomTargetAvoidCreep(creep, new RoomPosition(25,25,creep.memory.targetRoomName))
                    return
                }
                if (creep.memory.targetCreep == undefined) {
                    creeps = []
                    allCreep = creep.room.find(FIND_MY_CREEPS)
                    Log(creep, "l4upgrader")
                    creeps = allCreep.filter((c) => {
                        return c.memory.role == 'upgrader';
                    })
                    
                    if (!creeps.length) {
                        Log(creep, "l4harvester")
    
                        creeps = allCreep.filter((c) => {
                            return c.memory.role == 'builder';
                        })
                    }
                    if (!creeps.length) {
                        Log(creep, "l4harvester")
    
                        creeps = allCreep.filter((c) => {
                            return c.memory.role == 'harvester';
                        })
                    }

                    if (creeps.length) {
                        targetCreep = creep.pos.findClosestByRange(creeps)
                        creep.memory.targetCreep = targetCreep.id
                    }
                }
                
                targetCreep = Game.getObjectById(creep.memory.targetCreep)
                if (targetCreep == null) {
                    delete creep.memory.targetCreep;
                    return
                }
                Log(creep, targetCreep)
                // console.log(targetCreep)
                if (creep.transfer(targetCreep, RESOURCE_ENERGY) != OK) {
                    creep.moveTo(targetCreep)
                }
            }
        } else {
            Log(creep, "returning")

            var target = Game.getObjectById(Memory.rooms[creep.memory.baseRoomName].mainStorage);
            if (target.store.getUsedCapacity(RESOURCE_ENERGY) <= 50000) {
                creep.memory.DIE = true
            }
            if (creep.withdraw(target, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                creep.moveTo(target, {
                    visualizePathStyle: { stroke: "#ffaa00" },
                });
            }
        }
    },
};

module.exports = roleTrucker;
