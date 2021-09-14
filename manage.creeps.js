var roleHarvester = require("role.harvester");
var roleHarvSup = require("role.harvesterSup");
var roleHarvesterExt = require("role.harvesterExt");
var roleUpgrader = require("role.upgrader");
var roleBuilder = require("role.builder");
var roleBuilderExt = require("role.builderExt");
var roleTower = require("tower");
var roleClaimer = require("role.claimer");
var roleMover = require("role.mover");
var roleMoverExt = require("role.moverExt");
var roleDefence = require("role.defense");
var roleScavenger = require("role.scavenger");
var roleTraveller = require("role.traveller");
var roleTrucker = require("role.trucker");
var roleSoldier = require("role.soldier");
var roleGunner = require("role.gunner");
var roleSieger = require("role.sieger");
var rolePowHarvester = require("role.powHarvester");
var rolePowMover = require("role.powMover");
var roleDoctor = require("role.doctor");
var roleInvader = require("role.invader");
var roleExplorer = require("role.explorer");
var roleCleaner = require("role.cleaner");

global.runCreeps = function () {
    
    for (var name in Game.creeps) {
        var creep = Game.creeps[name];
        try {
            if (creep.pos.x == 49) creep.move(7);
            if (creep.pos.y == 49) creep.move(1);
            if (creep.pos.x == 0) creep.move(3);
            if (creep.pos.y == 0) creep.move(5);

            pickupNearby(creep);
            
            if (creep.memory.role == "DIE") {
                spawn = Game.getObjectById(Memory.rooms[creep.memory.baseRoomName].mainSpawn.id)
                creep.moveTo(spawn.pos);
                if (spawn.recycleCreep(creep) != 0) {
                    creep.moveTo(spawn.pos);
                }
                continue
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
            
            if(creep.name == "Claimer_755") {
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
            if (creep.memory.role == "harvSup") {
                roleHarvSup.run(creep);
            }
            if (creep.memory.role == "moverExt") {
                roleMoverExt.run(creep);
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
            if (creep.memory.role == "mover") {
                var droppedResource = creep.pos.findClosestByRange(FIND_DROPPED_RESOURCES, {
                    filter: (r) => r.amount >= 150,
                });
                var tombstoneResource = creep.pos.findClosestByRange(FIND_TOMBSTONES, {
                    filter: (r) => r.store.getUsedCapacity() >= 150,
                });
                if (droppedResource || tombstoneResource) {
                    if (droppedResource)
                        creep.room.visual.circle(droppedResource.pos, {
                            color: "red",
                            radius: 0.5,
                            lineStyle: "dashed",
                        });
                    if (tombstoneResource)
                        creep.room.visual.circle(tombstoneResource.pos, {
                            color: "red",
                            radius: 0.5,
                            lineStyle: "dashed",
                        });
                    // console.log(droppedResource.pos)
                    roleScavenger.run(creep);
                    continue;
                }
                // if (creepRoomMap.get(creep.memory.baseRoomName+"harvester") == 0) {
                //     roleHarvester.run(creep)
                //     continue
                // }
                roleMover.run(creep);
            }
        } catch (e) {
            console.log(`${e}`);
            console.log(creep, " failed to run");
        }
    }
};
