require("role.harvesterCommon");

global.roleHarvesterMineral = {
    name: "harvesterMineral",
    roleMemory: { memory: {} },
    // prettier-ignore
    BodyParts: [WORK,WORK,WORK,WORK,WORK,WORK,WORK,CARRY,MOVE,MOVE,MOVE],
    baseBodyParts: [],
    bodyLoop: [WORK, WORK, WORK, CARRY, MOVE],
    /** @param {Creep} creep **/
    run: function (creep, focusHealing) {
        if (creep.memory.mining == undefined) {
            creep.memory.mining = true;
        }

        if (creep.memory.scoopSize == undefined || creep.spawning) {
            scoopSize = 0;
            _.forEach(creep.body, (b) => {
                if (b.type == WORK) {
                    scoopSize += 2;
                }
            });
            // console.log(creep.name, scoopSize)
            creep.memory.scoopSize = scoopSize;
        }

        if (creep.memory.targetSource == undefined) {
            console.log(`${creep.name} is awaiting a targetSource`);
        }

        if (creep.memory.mining && creep.store.getFreeCapacity() < creep.memory.scoopSize) {
            creep.memory.mining = false;
            creep.say("🔄 dropping");
        }
        if (!creep.memory.mining && creep.store.getUsedCapacity() == 0) {
            creep.memory.mining = true;
            creep.say("⛏️ mining");
        }

        if ((creep.ticksToLive < 300 || creep.memory.healing) && (creep.memory.noHeal == undefined || creep.memory.noHeal != true)) {
            creep.say("healing");
            creep.memory.healing = true;
            if (upgradeCreep(creep.name) == 0) {
                return;
            }
            if (returnToHeal(creep, creep.memory.baseRoomName)) return;
        }

        if (creep.memory.mining) {
            pickupNearby(creep);

            targetSource = Game.getObjectById(creep.memory.targetSource);
            if (targetSource.ticksToRegeneration) {
                creep.memory.DIE = true;
                return;
            }
            if (creep.harvest(targetSource) != OK) {
                creep.Move(targetSource, {
                    visualizePathStyle: { stroke: "#ffaa00" },
                });
            }
        } else {
            var target = null;

            if (Memory.rooms[creep.memory.baseRoomName].mineral[creep.memory.targetSource].container != undefined) {
                target = Game.getObjectById(Memory.rooms[creep.memory.baseRoomName].mineral[creep.memory.targetSource].container.id);
                creep.memory.targetContainer = target.id;
                Log(creep, "local ccont found");
                Log(creep, target);

                if (
                    target.store.getFreeCapacity() == 0 &&
                    Memory.rooms[creep.memory.baseRoomName].mineral[creep.memory.targetSource].targettedByMover == 0 &&
                    creepRoomMap.get(creep.memory.baseRoomName + "harvesterMineralSupportTarget" + creep.memory.targetSource) == undefined
                ) {
                    spawnCreep(roleHarvesterMineralSupport, "auto", { memory: { targetContainer: target.id, noHeal: true, targetSource: creep.memory.targetSource } }, creep.memory.baseRoomName);
                }

                for (var type in creep.store) {
                    if (creep.transfer(target, type) != OK) {
                        creep.Move(target);
                    }
                    return;
                }
            } else {
            }

            mainStorage = Game.getObjectById(Memory.rooms[creep.memory.baseRoomName].mainStorage);
            if (mainStorage != undefined) {
                Log(creep, "mainStorage found");
                for (var type in creep.store) {
                    if (creep.transfer(mainStorage, type) == ERR_NOT_IN_RANGE) {
                        creep.Move(mainStorage);
                    }
                    return;
                }
            }
            Log(creep, "mainStorage not found");
            console.log(`${creep.name} can't find mainStorage`);
        }
    },
};

function fallbackToOtherRoles(creep) {
    Log(creep, "fallbackToOtherRoles");
    var targets = creep.room.find(FIND_CONSTRUCTION_SITES);
    if (targets.length) {
        roleBuilder.run(creep);
        return;
    } else {
        roleUpgrader.run(creep);
        return;
    }
}

module.exports = roleHarvester;
