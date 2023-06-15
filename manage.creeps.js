global.runCreeps = function () {
    myRooms[Game.shard.name].forEach((r) => {
        if (!Game.rooms[r]) return;

        if (Memory.rooms[r].scav === null) Memory.rooms[r].scav = false;
        Memory.rooms[r].scav = false;
        var droppedResource = Game.rooms[r].find(FIND_DROPPED_RESOURCES).filter((r) => r.amount >= 150);
        var tombstoneResource = Game.rooms[r].find(FIND_TOMBSTONES).filter((r) => r.store.getUsedCapacity() >= 150);
        if (droppedResource.length)
            Game.rooms[r].visual.circle(droppedResource[0].pos, {
                color: "red",
                radius: 0.5,
                lineStyle: "dashed",
            });
        if (tombstoneResource.length)
            Game.rooms[r].visual.circle(tombstoneResource[0].pos, {
                color: "red",
                radius: 0.5,
                lineStyle: "dashed",
            });
        if (droppedResource.length || tombstoneResource.length) {
            Memory.rooms[r].scav = true;
        }
    });

    for (var name in Game.creeps) {
        if (Object.keys(Game.creeps[name].memory).length == 0) {
            Game.creeps[name].memory = JSON.parse(InterShardMemory.getRemote("shard3"));
            Game.creeps[name].memory.InterShard.shift();
        }

        if (Game.cpu.getUsed() > (Game.cpu.tickLimit / 10) * 9.9) {
            console.log("CPU limit");
            return;
        }
        var creep = Game.creeps[name];
        // console.log(creep.name)
        try {
            if (creep.room.name == creep.room.baseRoomName) {
                if (creep.hits < creep.hitsMax) {
                    Memory.rooms[creep.memory.baseRoomName].mainTower.healRequested = true;
                }
            }

            if (creep.spawning) {
                trackedSpawn(creep);
            }

            if (creep.pos.x == 49) creep.move(7);
            if (creep.pos.y == 49) creep.move(1);
            if (creep.pos.x == 0) creep.move(3);
            if (creep.pos.y == 0) creep.move(5);

            pickupNearby(creep);

            // cull creeps
            _.forEach(creepsToKill, (c) => {
                creepToKill = Game.creeps[c];
                if (creepToKill != null) {
                    console.log(`setting ${creep.name} to DIE`);
                    creepToKill.memory.DIE = true;
                }
            });
            creepsToKill = [];
            if (creep.memory.DIE != undefined) {
                if (creep.spawning) {
                    // if this creep was copied from a another, it may have DIE set from the memory clone
                    console.log("spawning dying creep ", creep);
                    creep.memory.DIE = false;
                    delete creep.memory.DIE;
                } else {
                    spawn = Game.getObjectById(Memory.rooms[creep.memory.baseRoomName].mainSpawn.id);
                    creep.moveTo(spawn.pos);
                    if (spawn.recycleCreep(creep) != 0) {
                        creep.moveTo(spawn.pos);
                    }
                    continue;
                }
            }

            switch (creep.memory.role) {
                case "mover":
                    if (creep.room.energyAvailable > creep.room.energyCapacityAvailable / 2 && Memory.rooms[creep.room.name].scav == true && creep.room.memory.mainTower.enemyInRoom == false) {
                        roleScavenger.run(creep);
                        // console.log(creep.name, "scav")
                    } else {
                        roleMover.run(creep);
                        // console.log(creep.name, "mover")
                    }
                    break;
                case "moverExt":
                case "moverExtRepair":
                    roleMoverExt.run(creep);
                    continue;
                default:
                    eval("role" + _.capitalize(creep.memory.role)).run(creep);
            }
        } catch (e) {
            console.log(`${e}`);
            console.log(creep, `${creep.pos} failed to run`);
        }
    }

    for (var name in Game.powerCreeps) {
        var creep = Game.powerCreeps[name];
        // console.log(creep.name)
        try {
            if (isNaN(creep.ticksToLive)) {
                ps = Game.getObjectById(Memory.rooms[creep.memory.baseRoomName].structs.pspawn.id);
                creep.spawn(ps);
                return;
            }

            // if (creep.room.name != creep.memory.baseRoomName) {
            //     console.log("returning to room ", creep.memory.baseRoomName)
            //     moveToRoom(creep, creep.memory.baseRoomName);
            //     return
            // }
            mainSpawn = Game.getObjectById(Memory.rooms[creep.memory.baseRoomName].mainSpawn);
            mainStorage = Game.getObjectById(Memory.rooms[creep.memory.baseRoomName].mainStorage);
            factory = Game.getObjectById(Memory.rooms[creep.memory.baseRoomName].structs.factory.id);

            if (creep.ticksToLive < 50) {
                if (creep.transfer(mainStorage, RESOURCE_OPS) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(mainStorage);
                }
                return;
            }

            if (creep.ticksToLive < 300 || creep.memory.healing) {
                creep.say("healing");
                creep.memory.healing = true;
                ps = Game.getObjectById(Memory.rooms[creep.memory.baseRoomName].structs.pspawn.id);
                ret = creep.renew(ps);
                if (ret != OK) {
                    creep.moveTo(ps);
                }
            }

            if (!creep.room.controller.isPowerEnabled) {
                if (creep.enableRoom(creep.room.controller) != OK) {
                    creep.moveTo(creep.room.controller);
                }
                return;
            }

            if (creep.usePower(PWR_GENERATE_OPS) == OK) {
                return;
            }
            Log(creep, mainStorage.store.getUsedCapacity(RESOURCE_OPS));
            Log(creep, creep.store.getUsedCapacity(RESOURCE_OPS));
            Log(creep, creep.powers[PWR_OPERATE_FACTORY].level);
            Log(creep, factory.level);

            if (creep.memory.opFactory == true) {
                if (mainStorage.store.getUsedCapacity(RESOURCE_OPS) + creep.store.getUsedCapacity(RESOURCE_OPS) > 100) {
                    if (factory != null && creep.powers[PWR_OPERATE_FACTORY] != undefined && (creep.powers[PWR_OPERATE_FACTORY].level == undefined || creep.powers[PWR_OPERATE_FACTORY].level == factory.level) && factory.effects.length == 0) {
                        if (creep.powers[PWR_OPERATE_FACTORY].level || 0 > factory.level || 0) {
                            if (creep.store.getUsedCapacity(RESOURCE_OPS) < 100) {
                                if (creep.withdraw(mainStorage, RESOURCE_OPS) == ERR_NOT_IN_RANGE) {
                                    creep.moveTo(mainStorage);
                                }
                            } else {
                                if (creep.pos.isNearTo(factory)) ret = creep.usePower(PWR_OPERATE_FACTORY, factory);
                                else creep.moveTo(factory);
                            }
                            return;
                        }
                    }
                }
            }

            if (creep.memory.sweetSpot == undefined) {
                ps = Game.getObjectById(Memory.rooms[creep.memory.baseRoomName].structs.pspawn.id);
                creep.memory.sweetSpot = new RoomPosition(ps.pos.x + 1, ps.pos.y - 1, ps.room.name);
            }
            creep.moveTo(creep.memory.sweetSpot.x, creep.memory.sweetSpot.y);

            if (creep.store.getFreeCapacity() == 0) {
                if (creep.transfer(mainStorage, RESOURCE_OPS) != OK) {
                    creep.moveTo(mainStorage);
                }
                return;
            }

            // if (creep.usePower(PWR_OPERATE_SPAWN, mainSpawn) != OK) {
            //     creep.moveTo(mainSpawn);
            //     creep.usePower(PWR_GENERATE_OPS);
            // }
            creep.usePower(PWR_GENERATE_OPS);
        } catch (e) {
            console.log(`${e}`);
            console.log(creep, " failed to run");
        }
    }
};
