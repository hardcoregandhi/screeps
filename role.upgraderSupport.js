global.roleUpgraderSupport = {
    name: "upgraderSupport",
    roleMemory: { memory: { targetRoomName: null } },
    // prettier-ignore
    BodyParts: [CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, ],
    baseBodyParts: [MOVE, MOVE, MOVE, CARRY, CARRY],
    bodyLoop: [MOVE, CARRY],

    /** @param {Creep} creep **/
    run: function (creep) {
        // creep.memory.DIE = true
        Log(creep, "run()");
        if (creep.memory.returning == undefined) {
            creep.memory.returning = true;
        }
        if (creep.memory.targetCreep == undefined) {
            creep.memory.targetCreep = null;
        }

        if (creep.memory.returning && creep.store.getFreeCapacity() == 0) {
            creep.memory.returning = false;
            creep.say("m2dest");
        }
        if (!creep.memory.returning && creep.store.getUsedCapacity() == 0) {
            creep.memory.returning = true;
            creep.say("m2home");
        }

        if ((creep.ticksToLive < 300 || creep.memory.healing) && (creep.memory.noHeal == undefined || creep.memory.noHeal != true)) {
            creep.say("healing");
            creep.memory.healing = true;
            if (returnToHeal(creep, creep.memory.baseRoomName)) return;
        }

        if (Game.rooms[creep.memory.baseRoomName].controller.level == 8) {
            creep.memory.DIE = true;
            return;
        }

        if (!creep.memory.returning) {
            Log(creep, "!returning");
            Log(creep, creep.memory.targetCreep);

            targetCreep = Game.getObjectById(creep.memory.targetCreep);
            if (targetCreep && targetCreep.store.getFreeCapacity() < 100) {
                Log(creep, "deleting targetCreep");

                creep.memory.targetCreep = null;
            }

            if (creep.memory.targetCreep == undefined) {
                creeps = [];
                allCreep = creep.room.find(FIND_MY_CREEPS);
                Log(creep, "l4upgrader");

                creeps = allCreep.filter((c) => {
                    return c.memory.role == "upgrader" && c.store.getFreeCapacity() >= Math.min(50, creep.store.getUsedCapacity());
                });

                if (!creeps.length) {
                    Log(creep, "l4builder");
                    creeps = allCreep.filter((c) => {
                        return c.memory.role == "builder" && c.store.getFreeCapacity() >= Math.min(50, creep.store.getUsedCapacity());
                    });
                }

                if (creeps.length) {
                    targetCreep = creep.pos.findClosestByRange(creeps);
                    creep.memory.targetCreep = targetCreep.id;
                    Log(creep, "new target", targetCreep);
                }
            }

            targetCreep = Game.getObjectById(creep.memory.targetCreep);
            if (targetCreep == null) {
                delete creep.memory.targetCreep;
                return;
            }
            Log(creep, targetCreep);
            // console.log(targetCreep)
            if (creep.transfer(targetCreep, RESOURCE_ENERGY) != OK) {
                creep.Move(targetCreep);
            } else {
                targetCreep.memory.upgrading = true;
            }
        } else {
            Log(creep, "returning");

            var target = Game.getObjectById(Memory.rooms[creep.memory.baseRoomName].mainStorage);
            if (creep.withdraw(target, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                creep.Move(target, {
                    visualizePathStyle: { stroke: "#ffaa00" },
                });
            }
        }
    },
};
