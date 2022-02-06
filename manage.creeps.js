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
                    console.log("spawning dying creep");
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

            // if(creep.name == "Soldier_748") {
            //     if(creep.memory.healing != true && Game.rooms[creep.memory.targetRoomName] == undefined) {
            //         // moveToRoom(creep, creep.memory.targetRoomName)
            //         roomPath = Game.map.findRoute(creep.room.name, creep.memory.targetRoomName)
            //         const exit = creep.pos.findClosestByRange(roomPath[0].exit);
            //         if(creep.fatigue == 0) {
            //             creep.moveTo(exit);

            //             if(creep.memory._move != undefined) {
            //                 targetPos = new RoomPosition(creep.memory._move.dest.x, creep.memory._move.dest.y, creep.memory._move.dest.room)
            //                 if(targetPos.lookFor(LOOK_STRUCTURES).length != 0) {
            //                     log.log("found structure in paath")
            //                     usePathfinder(creep, { pos: new RoomPosition(25, 25, roomPath[0].room), range: 1 })
            //                 }
            //             }
            //         }
            //         continue
            //     }
            // }

            if (creep.name == "Claimer_755") {
                if (creep.ticksToLive < 300 || creep.memory.healing) {
                    creep.say("healing");
                    creep.memory.healing = true;
                    if (returnToHeal(creep, creep.memory.baseRoomName)) return;
                }
            }

            if (creep.memory.role == "traveller") {
                roleTraveller.run(creep);
                continue;
            }
            // var closestHostile = creep.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
            // if (closestHostile) {
            //     roleDefence.run(creep)
            //     continue
            // }
            // if (creep.memory.role == "upgrader" && creepRoomMap.get(creep.room.name + "harvester") < 1) {
            //     roleHarvester.run(creep);
            //     continue;
            // }
            if (creep.memory.role == "harvester") {
                roleHarvester.run(creep, focusHealing);
            }
            if (creep.memory.role == "upgrader") {
                roleUpgrader.run(creep);
            }
            if (creep.memory.role == "builder") {
                roleBuilder.run(creep);
            }
            if (creep.memory.role == "builderExt") {
                roleBuilderExt.run(creep);
            }
            if (creep.memory.role == "claimer") {
                roleClaimer.run(creep);
            }
            if (creep.memory.role == "harvesterExt") {
                roleHarvesterExt.run(creep);
            }
            if (creep.memory.role == "harvesterDeposit") {
                roleHarvesterDeposit.run(creep);
            }
            if (creep.memory.role == "harvSup") {
                roleHarvSup.run(creep);
            }
            if (creep.memory.role == "moverExt" || creep.memory.role == "moverExtRepair") {
                roleMoverExt.run(creep);
            }
            if (creep.memory.role == "moverLink") {
                roleMoverLink.run(creep);
            }
            if (creep.memory.role == "trucker") {
                roleTrucker.run(creep);
            }
            if (creep.memory.role == "soldier") {
                roleSoldier.run(creep);
            }
            if (creep.memory.role == "gunner") {
                roleGunner.run(creep);
            }
            if (creep.memory.role == "sieger") {
                roleSieger.run(creep);
            }
            if (creep.memory.role == "powHarvester") {
                rolePowHarvester.run(creep);
            }
            if (creep.memory.role == "powMover") {
                rolePowMover.run(creep);
            }
            if (creep.memory.role == "doctor") {
                roleDoctor.run(creep);
            }
            if (creep.memory.role == "invader") {
                roleInvader.run(creep);
            }
            if (creep.memory.role == "explorer") {
                roleExplorer.run(creep);
            }
            if (creep.memory.role == "cleaner") {
                roleCleaner.run(creep);
            }
            if (creep.memory.role == "healer") {
                roleHealer.run(creep);
            }
            if (creep.memory.role == "wanderer") {
                roleWanderer.run(creep);
            }
            if (creep.memory.role == "healerChase") {
                roleHealerChase.run(creep);
            }
            if (creep.memory.role == "mover") {
                if (creep.room.energyAvailable > 600 && Memory.rooms[creep.room.name].scav == true) {
                    roleScavenger.run(creep);
                    // console.log(creep.name, "scav")
                } else {
                    roleMover.run(creep);
                    // console.log(creep.name, "mover")
                }
            }
            if (creep.memory.role == "engineer") {
                eval("role" + _.capitalize(creep.memory.role)).run(creep);
            }
            if (creep.memory.role == "raider") {
                eval("role" + _.capitalize(creep.memory.role)).run(creep);
            }
            if (creep.memory.role == "harvesterMineral") {
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

            if (creep.ticksToLive < 50) {
                mainStorage = Game.getObjectById(Memory.rooms[creep.room.name].mainStorage);
                if (creep.transfer(mainStorage, RESOURCE_OPS) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(mainStorage);
                }
                return;
            }

            if (creep.ticksToLive < 300 || creep.memory.healing) {
                creep.say("healing");
                creep.memory.healing = true;
                ps = Game.getObjectById(Memory.rooms[creep.room.name].structs.pspawn.id);
                ret = creep.renew(ps);
                if (ret != OK) {
                    creep.moveTo(ps);
                }
            }

            if (!creep.room.controller.isPowerEnabled) {
                if (creep.enableRoom(creep.room.controller) != OK) {
                    creep.moveTo(creep.room.controller);
                }
            }

            if (creep.room.memory.structs.factory != undefined) {
                factory = Game.getObjectById(creep.room.memory.structs.factory.id);
                if (factory != undefined) {
                    if (factory.level == undefined) {
                        ret = creep.usePower(PWR_OPERATE_FACTORY, factory);
                        if (ret == ERR_NOT_IN_RANGE) {
                            creep.moveTo(factory);
                        }
                    }
                }
            }

            if (creep.usePower(PWR_OPERATE_SPAWN, Game.spawns["Spawn7"]) != OK) {
                creep.moveTo(Game.spawns["Spawn7"]);
                creep.usePower(PWR_GENERATE_OPS);
            }
        } catch (e) {
            console.log(`${e}`);
            console.log(creep, " failed to run");
        }
    }
};
