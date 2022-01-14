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
            if(creep.room.name == creep.room.baseRoomName) {
                if(creep.hits < creep.hitsMax) {
                    Memory.rooms[creep.memory.baseRoomName].mainTower.healRequested = true
                }
            }
            
            
            if (creep.pos.x == 49) creep.move(7);
            if (creep.pos.y == 49) creep.move(1);
            if (creep.pos.x == 0) creep.move(3);
            if (creep.pos.y == 0) creep.move(5);

            pickupNearby(creep);

            if (creep.memory.DIE != undefined) {
                spawn = Game.getObjectById(Memory.rooms[creep.memory.baseRoomName].mainSpawn.id);
                creep.moveTo(spawn.pos);
                if (spawn.recycleCreep(creep) != 0) {
                    creep.moveTo(spawn.pos);
                }
                continue;
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
            if (creep.memory.role == "moverExt") {
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
            if (creep.memory.role == "healerChase") {
                roleHealerChase.run(creep);
            }
            if (creep.memory.role == "mover") {
                if (creep.room.energyAvailable > 300 && Memory.rooms[creep.room.name].scav == true) {
                    roleScavenger.run(creep);
                    // console.log(creep.name, "scav")
                } else {
                    roleMover.run(creep);
                    // console.log(creep.name, "mover")
                }
            }
        } catch (e) {
            console.log(`${e}`);
            console.log(creep, " failed to run");
        }
    }
};
